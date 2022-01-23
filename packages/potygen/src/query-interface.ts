import {
  ArrayConstructorTag,
  AstTag,
  BinaryExpressionTag,
  ExpressionListTag,
  ExpressionTag,
  ReturningListItemTag,
  SelectListItemTag,
  SelectTag,
  StarIdentifierTag,
  TableTag,
  Tag,
  ArrayTypeTag,
  TypeTag,
} from './grammar.types';
import {
  isColumn,
  isColumns,
  isCTEValues,
  isCTEValuesList,
  isDefault,
  isFilter,
  isFunctionArg,
  isOrderBy,
  isParameter,
  isReturning,
  isSelectList,
  isTable,
  isValues,
} from './grammar.guards';
import { last, chunk, first, initial, tail, isEqual } from './util';
import {
  typeUnknown,
  binaryOperatorTypes,
  unaryOperatorTypes,
  typeNull,
  typeString,
  typeBoolean,
  typeAny,
  typeDate,
  typeNumber,
  pgTypeAliases,
  pgTypes,
} from './postgres-types-map';
import { isTypeConstant, isTypeEqual, isTypeString } from './query-interface.guards';
import {
  Type,
  Param,
  Source,
  QueryInterface,
  TypeConstant,
  TypeLoadOperator,
  Result,
  TypeContext,
  TypeLoadColumn,
  TypeUnknown,
  OperatorVariantPart,
  OperatorVariant,
  LoadName,
  TypeName,
} from './query-interface.types';
import { TypeLoadNamed } from '.';

/**
 * Initial context for the toSourcesIterator.
 * Used to allow nesting and recusion
 */
interface SourcesIteratorContext {
  /**
   * Previous sources to add to.
   */
  sources?: Source[];
  /**
   * Is the source part of "result" calculation or not.
   * If a source is only involved in "params" it wouldn't be used in result calculations
   */
  isResult?: boolean;
}

/**
 * A {@link Tag} that can determine return or parameter types of {@link QueryInterface}
 */
type QueryInterfaceSqlTag =
  | ExpressionTag
  | StarIdentifierTag
  | ArrayTypeTag
  | TypeTag
  | SelectTag
  | ExpressionListTag
  | ArrayConstructorTag;

const toSourcesIterator =
  ({ sources = [], isResult = true }: SourcesIteratorContext = {}) =>
  (sql: Tag): Source[] => {
    /**
     * Nested sources would not be involved in results, only params
     */
    const nestedRecur = toSourcesIterator({ sources, isResult: false });
    const recur = toSourcesIterator({ sources, isResult });
    switch (sql.tag) {
      case 'Table':
        const asTag = sql.values[1];
        const tableTags = first(sql.values).values;
        const table = last(tableTags);
        const schema = tableTags.length === 2 ? first(tableTags) : undefined;

        const name = asTag ? first(asTag.values) : table;
        return sources.concat({
          type: 'Table',
          isResult,
          sourceTag: sql,
          name: name.value,
          schema: schema?.value,
          table: table.value,
        });
      case 'NamedSelect':
        return sources.concat([
          ...recur(first(sql.values)),
          {
            type: 'Query',
            sourceTag: sql,
            name: first(last(sql.values).values).value,
            value: toQueryInterface(first(sql.values), sources),
          },
        ]);
      case 'Exists':
      case 'ComparationArray':
      case 'ComparationArrayInclusion':
        return sources.concat(nestedRecur(last(sql.values)));
      case 'CTE':
        const cteQuery = last(sql.values);
        if (isCTEValuesList(cteQuery)) {
          const cteNameParts = first(sql.values).values;
          const cteValuesItem = first(cteQuery.values.filter(isCTEValues));
          const valuesType = toType({ type: typeUnknown, columns: [] });
          const columnNames =
            cteNameParts.length === 2 ? last(cteNameParts).values.map((column) => column.value) : undefined;

          return sources.concat({
            type: 'Values',
            sourceTag: sql,
            name: first(first(sql.values).values).value,
            types: cteValuesItem?.values.map<TypeLoadNamed>((item, index) => ({
              type: LoadName.LoadNamed,
              name: columnNames?.[index] ?? `column${index}`,
              value: valuesType(item),
              sourceTag: item,
            })),
          });
        } else {
          const queryValue = toQueryInterface(cteQuery, sources);
          return sources.concat({
            type: 'Query',
            sourceTag: sql,
            name: first(first(sql.values).values).value,
            value: queryValue,
          });
        }
      case 'With':
        return sources.concat(
          /**
           * Each subsequent CTE query will have access to the results of the previous ones.
           */
          initial(sql.values).reduce(
            (acc, item) => toSourcesIterator({ sources: acc, isResult: false })(item),
            sources,
          ),
          recur(last(sql.values)),
        );
      default:
        return 'values' in sql ? sources.concat(sql.values.flatMap(recur)) : sources;
    }
  };

/**
 * Do not load tables that are named the same as queries
 */
const isRedundantSource = (source: Source, index: number, all: Source[]): boolean =>
  source.type === 'Table'
    ? !all.some((item) => (item.type === 'Query' || item.type == 'Values') && item.name === source.name)
    : true;

const firstKnownType = (...types: Type[]): Type => types.find((item) => item.type !== 'Unknown') ?? typeUnknown;

/**
 * Get the type from a part of a binary operator expression {@link BinaryExpressionTag}
 * First attempt to get an exact match
 * Otherwise check variants if at least one part matches.
 *
 * If there are multiple variants that match, return "unknown"
 */
export const toConstantBinaryOperatorVariant = (
  variants: OperatorVariant[],
  left: TypeConstant,
  right: TypeConstant,
  part: OperatorVariantPart,
): TypeConstant => {
  const matchedVariants = variants.filter(
    (variant) =>
      isTypeEqual(variant[OperatorVariantPart.Left], left) && isTypeEqual(variant[OperatorVariantPart.Right], right),
  );

  if (matchedVariants.length === 1) {
    return matchedVariants[0][part];
  }

  const looseAvailableVariants = variants.filter(
    (variant) =>
      isTypeEqual(variant[OperatorVariantPart.Left], left) || isTypeEqual(variant[OperatorVariantPart.Right], right),
  );

  return looseAvailableVariants.length === 1
    ? looseAvailableVariants[0][part]
    : { ...typeUnknown, postgresType: `any` };
};

export const toAliasedPgType = (type: string): keyof typeof pgTypes => {
  const trimmedType = type.replace(/^_/, '').replace(/\"/g, '').toLowerCase();
  return pgTypeAliases[trimmedType] ?? trimmedType;
};

/**
 * Convert postgres type into a potygen {@link TypeConstant}
 */
export const toPgTypeConstant = (type: string): TypeConstant | undefined => pgTypes[toAliasedPgType(type)];

/**
 * Get the type from a part of a binary operator expression {@link BinaryExpressionTag}
 *
 * If all of the types are known ({@link TypeConstant}) perform {@link toConstantBinaryOperatorVariant}
 * Otherwise return {@link TypeLoadOperator} type that will load the required types from the schema and attempt to match variants then.
 */
const toBinaryOperatorVariant = (
  availableTypes: OperatorVariant[],
  left: Type,
  right: Type,
  sourceTag: BinaryExpressionTag,
  part: OperatorVariantPart,
): TypeConstant | TypeLoadOperator =>
  isTypeConstant(left) && isTypeConstant(right)
    ? toConstantBinaryOperatorVariant(availableTypes, left, right, part)
    : { type: LoadName.LoadOperator, available: availableTypes, part, left, right, sourceTag };

/**
 * Determine which {@link Type} is a {@link QueryInterfaceSqlTag}.
 */
const toType =
  (context: TypeContext) =>
  (sql: QueryInterfaceSqlTag): Type => {
    const recur = toType(context);
    switch (sql.tag) {
      case 'ArrayConstructor':
      case 'ExpressionList':
        return {
          type: LoadName.LoadArray,
          items: { type: LoadName.LoadUnion, items: sql.values.map(recur), sourceTag: sql },
          sourceTag: sql,
        };
      case 'ArrayColumnIndex':
        return { type: LoadName.LoadArrayItem, value: recur(first(sql.values)), sourceTag: sql };
      case 'WrappedExpression':
        if (sql.values.length === 2) {
          switch (sql.values[1].tag) {
            case 'ArrayIndex':
              return { type: LoadName.LoadArrayItem, value: recur(first(sql.values)), sourceTag: sql };
            case 'CompositeAccess':
              return {
                type: LoadName.LoadCompositeAccess,
                value: recur(first(sql.values)),
                name: sql.values[1].values[0].value,
                sourceTag: sql,
              };
          }
        } else {
          return recur(first(sql.values));
        }
      case 'TernaryExpression':
        return { type: TypeName.Boolean, postgresType: 'bool' };
      case 'BinaryExpression':
        return toBinaryOperatorVariant(
          binaryOperatorTypes[sql.values[1].value],
          recur(sql.values[0]),
          recur(sql.values[2]),
          sql,
          OperatorVariantPart.Result,
        );
      case 'Boolean':
        return {
          type: TypeName.Boolean,
          literal: sql.value.toLowerCase() === 'true' ? true : false,
          postgresType: 'bool',
        };
      case 'Case':
        return { type: LoadName.LoadUnion, items: sql.values.map((item) => recur(last(item.values))), sourceTag: sql };
      case 'CaseSimple':
        return {
          type: LoadName.LoadUnion,
          items: tail(sql.values).map((item) => recur(last(item.values))),
          sourceTag: sql,
        };
      case 'Cast':
      case 'PgCast':
        const castData = first(sql.values);
        const castType = recur(last(sql.values));
        return isColumn(castData)
          ? { type: LoadName.LoadColumnCast, column: recur(castData), value: castType, sourceTag: sql }
          : castType;
      case 'Column':
        const contextFromTable = context.from ? first(context.from.values) : undefined;
        return {
          type: LoadName.LoadColumn,
          column: last(sql.values).value,
          table:
            sql.values.length === 3
              ? sql.values[1].value
              : sql.values.length === 2
              ? sql.values[0].value
              : contextFromTable
              ? last(contextFromTable.values).value
              : undefined,
          schema:
            sql.values.length === 3
              ? sql.values[0].value
              : contextFromTable?.values.length === 2
              ? contextFromTable.values[0].value
              : undefined,
          sourceTag: sql,
        };
      case 'Function':
        const functionNameParts = first(sql.values).values;
        const functionName = last(functionNameParts).value.toLowerCase();
        const schema = functionNameParts.length === 2 ? functionNameParts[0].value.toLowerCase() : undefined;
        const args = sql.values.filter(isFunctionArg).map(recur);
        switch (functionName) {
          case 'coalesce':
            return { type: LoadName.LoadCoalesce, items: args, sourceTag: sql };
          case 'greatest':
          case 'least':
            return {
              type: LoadName.LoadNamed,
              name: functionName,
              value: args.find(isTypeConstant) ?? args[0],
              sourceTag: sql,
            };
          case 'nullif':
            return { type: LoadName.LoadUnion, items: [typeNull, args[0]], sourceTag: sql };
          case 'array_agg':
            return { type: LoadName.LoadAsArray, items: args[0] ?? typeUnknown, sourceTag: sql };
          case 'json_agg':
          case 'jsonb_agg':
            return { type: LoadName.LoadArray, items: args[0] ?? typeUnknown, sourceTag: sql };
          case 'current_date':
            return { ...typeDate, postgresType: 'date' };
          case 'current_timestamp':
            return { ...typeDate, postgresType: 'timestamp' };
          case 'curtent_time':
            return { ...typeString, postgresType: 'time' };
          case 'json_build_object':
          case 'jsonb_build_object':
            return {
              type: LoadName.LoadObjectLiteral,
              items: chunk(2, args).flatMap(([name, type]) =>
                isTypeString(name) && name.literal ? { name: name.literal, type } : [],
              ),
              sourceTag: sql,
            };
          default:
            return { type: LoadName.LoadFunction, schema, name: functionName, args, sourceTag: sql };
        }
      case 'Null':
        return typeNull;
      case 'Number':
        return { type: TypeName.Number, literal: Number(sql.value), postgresType: 'float4' };
      case 'Parameter':
        return typeAny;
      case 'Row':
      case 'RowKeyward':
        return { type: LoadName.LoadNamed, value: { ...typeString, postgresType: 'row' }, name: 'row', sourceTag: sql };
      case 'Select':
        return {
          type: LoadName.LoadOptional,
          nullable: true,
          value: recur(sql.values.filter(isSelectList)[0].values[0].values[0]),
          sourceTag: sql,
        };
      case 'StarIdentifier':
        return {
          type: LoadName.LoadStar,
          table:
            sql.values.length === 3 ? sql.values[1].value : sql.values.length === 2 ? sql.values[0].value : undefined,
          schema: sql.values.length === 3 ? sql.values[0].value : undefined,
          sourceTag: sql,
        };
      case 'String':
      case 'DollarQuotedString':
      case 'CustomQuotedString':
      case 'BitString':
      case 'EscapeString':
      case 'HexademicalString':
      case 'CustomQuotedString':
        return { type: TypeName.String, literal: sql.value, postgresType: 'text' };
      case 'Exists':
      case 'ComparationArray':
      case 'ComparationArrayInclusion':
        return typeBoolean;
      case 'Type':
        const typeParts = first(sql.values).values;
        const typeName = last(typeParts).value.toLowerCase();
        const typeSchema = typeParts.length === 2 ? typeParts[0].value : undefined;
        const pgType = toPgTypeConstant(typeName);
        return pgType
          ? { type: LoadName.LoadNamed, name: pgTypeAliases[typeName] ?? typeName, value: pgType, sourceTag: sql }
          : { type: LoadName.LoadRecord, name: typeName, schema: typeSchema, sourceTag: sql };
      case 'ArrayType':
        return Array.from({ length: tail(sql.values).length }).reduce<Type>(
          (items) => ({ type: LoadName.LoadArray, items, sourceTag: sql }),
          recur(first(sql.values)),
        );
      case 'TypedConstant':
        const typeConstantName = first(sql.values).value.toLowerCase();
        return {
          type: LoadName.LoadNamed,
          name: pgTypeAliases[typeConstantName] ?? typeConstantName,
          value: toPgTypeConstant(typeConstantName) ?? typeUnknown,
          sourceTag: sql,
        };
      case 'Extract':
        return { type: LoadName.LoadNamed, name: 'date_part', value: typeNumber, sourceTag: sql };
      case 'UnaryExpression':
        return unaryOperatorTypes[sql.values[0].value] ?? recur(sql.values[1]);
    }
  };

const toResultName = (type: Type): string => {
  switch (type.type) {
    case 'LoadCoalesce':
      return 'coalesce';
    case 'LoadNamed':
      return type.name;
    case 'LoadArrayItem':
    case 'LoadOptional':
      return toResultName(type.value);
    case 'LoadArray':
    case 'Array':
      return 'array';
    case 'Boolean':
      return 'bool';
    case 'LoadColumn':
      return type.column;
    case 'LoadColumnCast':
      return toResultName(type.column);
    case 'LoadFunction':
      return type.name;
    case 'LoadRecord':
      return 'row';
    case 'LoadCompositeAccess':
      return type.name;
    default:
      return '?column?';
  }
};

const toResult =
  (context: TypeContext) =>
  (sql: SelectListItemTag | ReturningListItemTag): Result => {
    const type = toType(context)(first(sql.values));
    return {
      name: sql.values.length === 2 ? first(last(sql.values).values).value : toResultName(type),
      type: toType(context)(first(sql.values)),
    };
  };

export const toQueryFrom = (sql: AstTag): TableTag | undefined => {
  switch (sql.tag) {
    case 'Update':
      return sql.values.find(isTable);
    case 'Insert':
      return sql.values.find(isTable);
    case 'Delete':
      return sql.values.find(isTable);
    case 'With':
      return toQueryFrom(last(sql.values));
    default:
      return undefined;
  }
};

export const toQueryResults = (sql: AstTag): Array<SelectListItemTag | ReturningListItemTag> => {
  switch (sql.tag) {
    case 'Begin':
    case 'Savepoint':
    case 'Rollback':
    case 'Commit':
      return [];
    case 'Select':
      return sql.values.filter(isSelectList).flatMap((list) => list.values);
    case 'Update':
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case 'Insert':
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case 'Delete':
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case 'With': {
      return toQueryResults(last(sql.values));
    }
  }
};

export const toParams =
  (context: TypeContext) =>
  (sql: Tag): Param[] => {
    const recur = toParams(context);
    const toTypeRecur = toType(context);
    switch (sql.tag) {
      case 'TernaryExpression':
        const arg1Type = toTypeRecur(sql.values[2]);
        const arg2Type = toTypeRecur(sql.values[4]);
        const valueType = toTypeRecur(sql.values[0]);
        return [
          ...toParams({ ...context, type: firstKnownType(arg1Type, arg2Type) })(sql.values[0]),
          ...toParams({ ...context, type: firstKnownType(valueType, arg2Type) })(sql.values[2]),
          ...toParams({ ...context, type: firstKnownType(valueType, arg1Type) })(sql.values[4]),
        ];

      case 'SelectList':
        return context.columns.length
          ? sql.values.flatMap((item, index) =>
              toParams({ ...context, columns: [], type: context.columns[index] })(item),
            )
          : sql.values.flatMap(recur);

      case 'SetItem':
        const from = first(context.from?.values);
        const setType: TypeLoadColumn | TypeUnknown = from
          ? {
              type: LoadName.LoadColumn,
              column: first(sql.values).value,
              table: from.values.length === 2 ? from.values[1].value : from.values[0].value,
              schema: from.values.length === 2 ? from.values[0].value : undefined,
              sourceTag: first(sql.values),
            }
          : typeUnknown;
        return toParams({ ...context, type: setType })(last(sql.values));

      case 'BinaryExpression': {
        const operator = binaryOperatorTypes[sql.values[1].value];
        return [
          ...toParams({
            ...context,
            type: operator.length === 1 ? operator[0][OperatorVariantPart.Left] : toTypeRecur(sql.values[2]),
          })(sql.values[0]),
          ...toParams({
            ...context,
            type: operator.length === 1 ? operator[0][OperatorVariantPart.Right] : toTypeRecur(sql.values[0]),
          })(sql.values[2]),
        ];
      }
      case 'Insert':
        const table = sql.values.filter(isTable)[0];
        const tableName = first(table.values);
        return sql.values.flatMap(
          toParams({
            ...context,
            columns: sql.values.filter(isColumns).flatMap((columns) =>
              columns.values.map((column) => ({
                type: LoadName.LoadColumn,
                column: column.value,
                table: last(tableName.values).value,
                schema: tableName.values.length === 2 ? tableName.values[0].value : undefined,
                sourceTag: sql,
              })),
            ),
          }),
        );
      case 'Function':
        const functionName = last(first(sql.values).values).value.toLowerCase();
        switch (functionName) {
          case 'coalesce':
          case 'greatest':
          case 'least':
            return sql.values.flatMap(recur);
          default:
            const args = sql.values.filter(isFunctionArg);
            const argType = { args: args.map(toTypeRecur), name: functionName };

            return args
              .flatMap((arg, index) =>
                toParams({
                  ...context,
                  type: { type: LoadName.LoadFunctionArgument, ...argType, index, sourceTag: arg },
                })(arg),
              )
              .concat(sql.values.filter(isOrderBy).flatMap(recur), sql.values.filter(isFilter).flatMap(recur));
        }
      case 'Parameter':
        return [
          {
            name: sql.value,
            start: sql.start,
            end: sql.end,
            spread: sql.type === 'spread',
            required: sql.required || sql.pick.length > 0,
            type: context.type,
            pick: sql.pick.map((name, index) => ({ name: name.value, type: context.columns[index] ?? typeUnknown })),
          },
        ];
      case 'ComparationArrayInclusion':
      case 'ComparationArray':
        const column = first(sql.values);
        return column && isColumn(column)
          ? [
              ...toParams({
                ...context,
                type: { type: LoadName.LoadArrayItem, sourceTag: sql, value: toTypeRecur(last(sql.values)) },
              })(column),
              ...toParams({
                ...context,
                type: { type: LoadName.LoadArray, items: toTypeRecur(column), sourceTag: sql },
              })(last(sql.values)),
            ]
          : sql.values.flatMap(recur);
      case 'UnaryExpression':
        return toParams({ ...context, type: unaryOperatorTypes[sql.values[0].value] })(sql.values[1]);
      case 'ValuesList':
        return sql.values
          .filter(isValues)
          .flatMap((item) =>
            item.values.flatMap((column, index) =>
              isDefault(column) ? [] : toParams({ ...context, type: context.columns[index] })(column),
            ),
          )
          .concat(sql.values.filter(isParameter).flatMap(recur));
      case 'PgCast':
      case 'Cast':
        return toParams({ ...context, type: toTypeRecur(last(sql.values)) })(first(sql.values));
      case 'Limit':
      case 'Offset':
        return toParams({ ...context, type: typeString })(first(sql.values));
      default:
        return 'values' in sql ? sql.values.flatMap(recur) : [];
    }
  };

const isUniqParam = (item: Param, index: number, all: Param[]) =>
  all.findIndex((current) => item.name === current.name && isEqual(item.type, current.type)) === index;

export const toSources = (sql: AstTag): Source[] => toSourcesIterator()(sql).filter(isRedundantSource);

export const toQueryInterface = (sql: AstTag, parentSources: Source[] = []): QueryInterface => {
  const items = toQueryResults(sql);
  const from = toQueryFrom(sql);
  const typeContext = { type: typeUnknown, columns: [], from };

  return {
    sources: toSources(sql).concat(parentSources).filter(isRedundantSource),
    results: items.map(toResult(typeContext)),
    params: toParams(typeContext)(sql).filter(isUniqParam),
  };
};
