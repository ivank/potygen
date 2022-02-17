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
  SqlName,
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
import { isType, isTypeEqual, isTypeString, isTypeUnknown } from './query-interface.guards';
import {
  TypeOrLoad,
  Param,
  Source,
  QueryInterface,
  Type,
  TypeLoadOperator,
  Result,
  TypeContext,
  TypeLoadColumn,
  TypeUnknown,
  OperatorVariantPart,
  OperatorVariant,
  TypeLoadNamed,
  TypeName,
} from './query-interface.types';

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

/**
 * A {@link Tag} used to determine results of {@link QueryInterface}
 */
type ResultTag = SelectListItemTag | ReturningListItemTag;

const toSourcesIterator =
  ({ sources = [], isResult = true }: SourcesIteratorContext = {}) =>
  (sql: Tag): Source[] => {
    /**
     * Nested sources would not be involved in results, only params
     */
    const nestedRecur = toSourcesIterator({ sources, isResult: false });
    const recur = toSourcesIterator({ sources, isResult });
    switch (sql.tag) {
      case SqlName.Table:
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
      case SqlName.NamedSelect:
        return sources.concat([
          ...recur(first(sql.values)),
          {
            type: 'Query',
            sourceTag: sql,
            name: first(last(sql.values).values).value,
            value: toQueryInterface(first(sql.values), sources),
          },
        ]);
      case SqlName.Exists:
      case SqlName.ComparationArray:
      case SqlName.ComparationArrayInclusion:
        return sources.concat(nestedRecur(last(sql.values)));
      case SqlName.CTE:
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
              type: TypeName.LoadNamed,
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
      case SqlName.With:
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
      case SqlName.RecordsetFunction:
        const recordsetType = toType({ type: typeUnknown, columns: [] });
        return sources.concat({
          type: 'Recordset',
          isResult,
          sourceTag: sql,
          name: first(last(sql.values).values).value,
          columns: last(last(sql.values).values).values.map<TypeLoadNamed>((item) => ({
            type: TypeName.LoadNamed,
            name: first(item.values).value,
            value: recordsetType(last(item.values)),
            sourceTag: item,
          })),
        });
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

const firstKnownType = (...types: TypeOrLoad[]): TypeOrLoad =>
  types.find((item) => !isTypeUnknown(item)) ?? typeUnknown;

/**
 * Get the type from a part of a binary operator expression {@link BinaryExpressionTag}
 * First attempt to get an exact match
 * Otherwise check variants if at least one part matches.
 *
 * If there are multiple variants that match, return "unknown"
 */
export const toConstantBinaryOperatorVariant = (
  variants: OperatorVariant[],
  left: Type,
  right: Type,
  part: OperatorVariantPart,
): Type => {
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

export const toAliasedPgType = (type?: string): keyof typeof pgTypes => {
  const trimmedType = type?.replace(/^_/, '').replace(/\"/g, '').toLowerCase() ?? 'any';
  return pgTypeAliases[trimmedType] ?? trimmedType;
};

/**
 * Convert postgres type into a potygen {@link TypeConstant}
 */
export const toPgTypeConstant = (type?: string): Type | undefined => pgTypes[toAliasedPgType(type)];

/**
 * Get the type from a part of a binary operator expression {@link BinaryExpressionTag}
 *
 * If all of the types are known ({@link TypeConstant}) perform {@link toConstantBinaryOperatorVariant}
 * Otherwise return {@link TypeLoadOperator} type that will load the required types from the schema and attempt to match variants then.
 */
const toBinaryOperatorVariant = (
  availableTypes: OperatorVariant[],
  left: TypeOrLoad,
  right: TypeOrLoad,
  sourceTag: BinaryExpressionTag,
  part: OperatorVariantPart,
): Type | TypeLoadOperator =>
  isType(left) && isType(right)
    ? toConstantBinaryOperatorVariant(availableTypes, left, right, part)
    : { type: TypeName.LoadOperator, available: availableTypes, part, left, right, sourceTag };

/**
 * Determine which {@link Type} is a {@link QueryInterfaceSqlTag}.
 */
const toType =
  (context: TypeContext) =>
  (sql: QueryInterfaceSqlTag): TypeOrLoad => {
    const recur = toType(context);
    switch (sql.tag) {
      case SqlName.ArrayConstructor:
      case SqlName.ExpressionList:
        return {
          type: TypeName.LoadArray,
          items: { type: TypeName.LoadUnion, items: sql.values.map(recur), sourceTag: sql },
          sourceTag: sql,
        };
      case SqlName.ArrayColumnIndex:
        return { type: TypeName.LoadArrayItem, value: recur(first(sql.values)), sourceTag: sql };
      case SqlName.WrappedExpression:
        if (sql.values.length === 2) {
          switch (sql.values[1].tag) {
            case SqlName.ArrayIndex:
              return { type: TypeName.LoadArrayItem, value: recur(first(sql.values)), sourceTag: sql };
            case SqlName.CompositeAccess:
              return {
                type: TypeName.LoadCompositeAccess,
                value: recur(first(sql.values)),
                name: sql.values[1].values[0].value,
                sourceTag: sql,
              };
          }
        } else {
          return recur(first(sql.values));
        }
      case SqlName.TernaryExpression:
        return { type: TypeName.Boolean, postgresType: 'bool' };
      case SqlName.BinaryExpression:
        return toBinaryOperatorVariant(
          binaryOperatorTypes[sql.values[1].value],
          recur(sql.values[0]),
          recur(sql.values[2]),
          sql,
          OperatorVariantPart.Result,
        );
      case SqlName.Boolean:
        return {
          type: TypeName.Boolean,
          literal: sql.value.toLowerCase() === 'true' ? true : false,
          postgresType: 'bool',
        };
      case SqlName.Case:
        return { type: TypeName.LoadUnion, items: sql.values.map((item) => recur(last(item.values))), sourceTag: sql };
      case SqlName.CaseSimple:
        return {
          type: TypeName.LoadUnion,
          items: tail(sql.values).map((item) => recur(last(item.values))),
          sourceTag: sql,
        };
      case SqlName.Cast:
      case SqlName.PgCast:
        const castData = first(sql.values);
        const castType = recur(last(sql.values));
        return isColumn(castData)
          ? { type: TypeName.LoadColumnCast, column: recur(castData), value: castType, sourceTag: sql }
          : castType;
      case SqlName.Column:
        const contextFromTable = context.from ? first(context.from.values) : undefined;
        return {
          type: TypeName.LoadColumn,
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
      case SqlName.Function:
        const functionNameParts = first(sql.values).values;
        const functionName = last(functionNameParts).value.toLowerCase();
        const schema = functionNameParts.length === 2 ? functionNameParts[0].value.toLowerCase() : undefined;
        const args = sql.values.filter(isFunctionArg).map(recur);
        switch (functionName) {
          case 'coalesce':
            return { type: TypeName.LoadCoalesce, items: args, sourceTag: sql };
          case 'greatest':
          case 'least':
            return {
              type: TypeName.LoadNamed,
              name: functionName,
              value: args.find(isType) ?? args[0],
              sourceTag: sql,
            };
          case 'nullif':
            return { type: TypeName.LoadUnion, items: [typeNull, args[0]], sourceTag: sql };
          case 'array_agg':
            return { type: TypeName.LoadAsArray, items: args[0] ?? typeUnknown, sourceTag: sql };
          case 'json_agg':
          case 'jsonb_agg':
            return { type: TypeName.LoadArray, items: args[0] ?? typeUnknown, sourceTag: sql };
          case 'current_date':
            return { ...typeDate, postgresType: 'date' };
          case 'current_timestamp':
            return { ...typeDate, postgresType: 'timestamp' };
          case 'curtent_time':
            return { ...typeString, postgresType: 'time' };
          case 'json_build_object':
          case 'jsonb_build_object':
            return {
              type: TypeName.LoadObjectLiteral,
              items: chunk(2, args).flatMap(([name, type]) =>
                isTypeString(name) && name.literal ? { name: name.literal, type } : [],
              ),
              sourceTag: sql,
            };
          default:
            return { type: TypeName.LoadFunction, schema, name: functionName, args, sourceTag: sql };
        }
      case SqlName.Null:
        return typeNull;
      case SqlName.Number:
        return { type: TypeName.Number, literal: Number(sql.value), postgresType: 'float4' };
      case SqlName.Parameter:
        return typeAny;
      case SqlName.Row:
      case SqlName.RowKeyward:
        return { type: TypeName.LoadNamed, value: { ...typeString, postgresType: 'row' }, name: 'row', sourceTag: sql };
      case SqlName.Select:
        return {
          type: TypeName.LoadOptional,
          nullable: true,
          value: recur(sql.values.filter(isSelectList)[0].values[0].values[0]),
          sourceTag: sql,
        };
      case SqlName.StarIdentifier:
        return {
          type: TypeName.LoadStar,
          table:
            sql.values.length === 3 ? sql.values[1].value : sql.values.length === 2 ? sql.values[0].value : undefined,
          schema: sql.values.length === 3 ? sql.values[0].value : undefined,
          sourceTag: sql,
        };
      case SqlName.String:
      case SqlName.DollarQuotedString:
      case SqlName.CustomQuotedString:
      case SqlName.BitString:
      case SqlName.EscapeString:
      case SqlName.HexademicalString:
      case SqlName.CustomQuotedString:
        return { type: TypeName.String, literal: sql.value, postgresType: 'text' };
      case SqlName.Exists:
      case SqlName.ComparationArray:
      case SqlName.ComparationArrayInclusion:
        return typeBoolean;
      case SqlName.Type:
        const typeParts = first(sql.values).values;
        const typeName = last(typeParts).value.toLowerCase();
        const typeSchema = typeParts.length === 2 ? typeParts[0].value : undefined;
        const pgType = toPgTypeConstant(typeName);
        return pgType
          ? { type: TypeName.LoadNamed, name: pgTypeAliases[typeName] ?? typeName, value: pgType, sourceTag: sql }
          : { type: TypeName.LoadRecord, name: typeName, schema: typeSchema, sourceTag: sql };
      case SqlName.ArrayType:
        return Array.from({ length: tail(sql.values).length }).reduce<TypeOrLoad>(
          (items) => ({ type: TypeName.LoadArray, items, sourceTag: sql }),
          recur(first(sql.values)),
        );
      case SqlName.TypedConstant:
        const typeConstantName = first(sql.values).value.toLowerCase();
        return {
          type: TypeName.LoadNamed,
          name: pgTypeAliases[typeConstantName] ?? typeConstantName,
          value: toPgTypeConstant(typeConstantName) ?? typeUnknown,
          sourceTag: sql,
        };
      case SqlName.Extract:
        return { type: TypeName.LoadNamed, name: 'date_part', value: typeNumber, sourceTag: sql };
      case SqlName.UnaryExpression:
        return unaryOperatorTypes[sql.values[0].value] ?? recur(sql.values[1]);
    }
  };

/**
 * Determine the column name based on the result type
 */
const toResultName = (type: TypeOrLoad): string => {
  switch (type.type) {
    case TypeName.LoadCoalesce:
      return 'coalesce';
    case TypeName.LoadNamed:
      return type.name;
    case TypeName.LoadArrayItem:
    case TypeName.LoadOptional:
      return toResultName(type.value);
    case TypeName.LoadArray:
    case TypeName.Array:
      return 'array';
    case TypeName.Boolean:
      return 'bool';
    case TypeName.LoadColumn:
      return type.column;
    case TypeName.LoadColumnCast:
      return toResultName(type.column);
    case TypeName.LoadFunction:
      return type.name;
    case TypeName.LoadRecord:
      return 'row';
    case TypeName.LoadCompositeAccess:
      return type.name;
    default:
      return '?column?';
  }
};

/**
 * Convert an {@link }
 * @param context
 * @returns
 */
const toResult =
  (context: TypeContext) =>
  (sql: ResultTag): Result => {
    const type = toType(context)(first(sql.values));
    return {
      name: sql.values.length === 2 ? first(last(sql.values).values).value : toResultName(type),
      type: toType(context)(first(sql.values)),
    };
  };

/**
 * Get the "from" table of a query
 */
export const toQueryFrom = (sql: AstTag): TableTag | undefined => {
  switch (sql.tag) {
    case SqlName.Update:
      return sql.values.find(isTable);
    case SqlName.Insert:
      return sql.values.find(isTable);
    case SqlName.Delete:
      return sql.values.find(isTable);
    case SqlName.With:
      return toQueryFrom(last(sql.values));
    default:
      return undefined;
  }
};

/**
 * Get the {@link ResultTag} for for {@link QueryInterface} from {@link AstTag}
 */
export const toQueryResults = (sql: AstTag): Array<ResultTag> => {
  switch (sql.tag) {
    case SqlName.Begin:
    case SqlName.Savepoint:
    case SqlName.Rollback:
    case SqlName.Commit:
      return [];
    case SqlName.Select:
      return sql.values.filter(isSelectList).flatMap((list) => list.values);
    case SqlName.Update:
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case SqlName.Insert:
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case SqlName.Delete:
      return sql.values.filter(isReturning).flatMap((item) => item.values);
    case SqlName.With: {
      return toQueryResults(last(sql.values));
    }
  }
};

/**
 * Get all {@link Param} of an sql query or any sql tag. Works recursively
 */
export const toParams =
  (context: TypeContext) =>
  (sql: Tag): Param[] => {
    const recur = toParams(context);
    const toTypeRecur = toType(context);
    switch (sql.tag) {
      case SqlName.TernaryExpression:
        const arg1Type = toTypeRecur(sql.values[2]);
        const arg2Type = toTypeRecur(sql.values[4]);
        const valueType = toTypeRecur(sql.values[0]);
        return [
          ...toParams({ ...context, type: firstKnownType(arg1Type, arg2Type) })(sql.values[0]),
          ...toParams({ ...context, type: firstKnownType(valueType, arg2Type) })(sql.values[2]),
          ...toParams({ ...context, type: firstKnownType(valueType, arg1Type) })(sql.values[4]),
        ];

      case SqlName.SelectList:
        return context.columns.length
          ? sql.values.flatMap((item, index) =>
              toParams({ ...context, columns: [], type: context.columns[index] })(item),
            )
          : sql.values.flatMap(recur);

      case SqlName.SetItem:
        const from = first(context.from?.values);
        const setType: TypeLoadColumn | TypeUnknown = from
          ? {
              type: TypeName.LoadColumn,
              column: first(sql.values).value,
              table: from.values.length === 2 ? from.values[1].value : from.values[0].value,
              schema: from.values.length === 2 ? from.values[0].value : undefined,
              sourceTag: first(sql.values),
            }
          : typeUnknown;
        return toParams({ ...context, type: setType })(last(sql.values));

      case SqlName.BinaryExpression: {
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
      case SqlName.Insert:
        const table = sql.values.filter(isTable)[0];
        const tableName = first(table.values);
        return sql.values.flatMap(
          toParams({
            ...context,
            columns: sql.values.filter(isColumns).flatMap((columns) =>
              columns.values.map((column) => ({
                type: TypeName.LoadColumn,
                column: column.value,
                table: last(tableName.values).value,
                schema: tableName.values.length === 2 ? tableName.values[0].value : undefined,
                sourceTag: sql,
              })),
            ),
          }),
        );
      case SqlName.Function:
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
                  type: { type: TypeName.LoadFunctionArgument, ...argType, index, sourceTag: arg },
                })(arg),
              )
              .concat(sql.values.filter(isOrderBy).flatMap(recur), sql.values.filter(isFilter).flatMap(recur));
        }
      case SqlName.Parameter:
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
      case SqlName.ComparationArrayInclusion:
      case SqlName.ComparationArray:
        const column = first(sql.values);
        return column && isColumn(column)
          ? [
              ...toParams({
                ...context,
                type: { type: TypeName.LoadArrayItem, sourceTag: sql, value: toTypeRecur(last(sql.values)) },
              })(column),
              ...toParams({
                ...context,
                type: { type: TypeName.LoadArray, items: toTypeRecur(column), sourceTag: sql },
              })(last(sql.values)),
            ]
          : sql.values.flatMap(recur);
      case SqlName.UnaryExpression:
        return toParams({ ...context, type: unaryOperatorTypes[sql.values[0].value] })(sql.values[1]);
      case SqlName.ValuesList:
        return sql.values
          .filter(isValues)
          .flatMap((item) =>
            item.values.flatMap((column, index) =>
              isDefault(column) ? [] : toParams({ ...context, type: context.columns[index] })(column),
            ),
          )
          .concat(sql.values.filter(isParameter).flatMap(recur));
      case SqlName.PgCast:
      case SqlName.Cast:
        return toParams({ ...context, type: toTypeRecur(last(sql.values)) })(first(sql.values));
      case SqlName.Limit:
      case SqlName.Offset:
        return toParams({ ...context, type: typeString })(first(sql.values));
      case SqlName.CTE:
        return isCTEValuesList(last(sql.values)) || context.cteParams ? sql.values.flatMap(recur) : [];
      default:
        return 'values' in sql ? sql.values.flatMap(recur) : [];
    }
  };

/**
 * Filter out params with the same name and type
 * Different types are kept, as they will be used as union types.
 */
const isUniqParam = (item: Param, index: number, all: Param[]) =>
  all.findIndex((current) => item.name === current.name && isEqual(item.type, current.type)) === index;

/**
 * Get all the {@link Source} of a SQL query.
 */
export const toSources = (sql: AstTag): Source[] => toSourcesIterator()(sql).filter(isRedundantSource);

/**
 * Get the {@link QueryInterface} of an sql query.
 *
 * Nested sub-queries have access to more sources than just what's available inside it.
 */
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
