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
} from './query-interface.types';

const toSourcesIterator =
  (sources: Source[] = [], isResult = true) =>
  (sql: Tag): Source[] => {
    const nestedRecur = toSourcesIterator(sources, false);
    const recur = toSourcesIterator(sources, isResult);
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
          const valuesType = toType({ type: typeUnknown(), columns: [] });
          const columnNames =
            cteNameParts.length === 2 ? last(cteNameParts).values.map((column) => column.value) : undefined;

          return sources.concat({
            type: 'Values',
            sourceTag: sql,
            name: first(first(sql.values).values).value,
            types: cteValuesItem?.values.map((item, index) => ({
              type: 'Named' as const,
              name: columnNames?.[index] ?? `column${index}`,
              value: valuesType(item),
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
          initial(sql.values).reduce((acc, item) => toSourcesIterator(acc, false)(item), sources),
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

const coalesce = (...types: Type[]): Type => types.find((item) => item.type !== 'Unknown') ?? typeUnknown();

export const toContantBinaryOperatorVariant = (
  availableTypes: Array<[left: TypeConstant, rigth: TypeConstant, result: TypeConstant]>,
  left: TypeConstant,
  right: TypeConstant,
  index: 0 | 1 | 2,
): TypeConstant => {
  const matchedAvailableTypes = availableTypes.filter(
    (type) => isTypeEqual(type[0], left) && isTypeEqual(type[1], right),
  );

  if (matchedAvailableTypes.length === 1) {
    return matchedAvailableTypes[0][index];
  }

  const looseAvailableTypes = availableTypes.filter(
    (type) => isTypeEqual(type[0], left) || isTypeEqual(type[1], right),
  );

  return looseAvailableTypes.length === 1 ? looseAvailableTypes[0][index] : { type: 'Unknown', postgresType: `any` };
};

export const toAliasedPgType = (type: string): keyof typeof pgTypes => {
  const trimmedType = type.replace(/^_/, '').replace(/\"/g, '').toLowerCase();
  return pgTypeAliases[trimmedType] ?? trimmedType;
};

export const toPgTypeConstant = (type: string): TypeConstant | undefined => pgTypes[toAliasedPgType(type)];

const toBinaryOperatorVariant = (
  availableTypes: Array<[TypeConstant, TypeConstant, TypeConstant]>,
  left: Type,
  right: Type,
  sourceTag: BinaryExpressionTag,
  index: 0 | 1 | 2,
): TypeConstant | TypeLoadOperator =>
  isTypeConstant(left) && isTypeConstant(right)
    ? toContantBinaryOperatorVariant(availableTypes, left, right, index)
    : { type: 'LoadOperator', available: availableTypes, index, left, right, sourceTag };

const toType =
  (context: TypeContext) =>
  (
    sql:
      | ExpressionTag
      | StarIdentifierTag
      | ArrayTypeTag
      | TypeTag
      | SelectTag
      | ExpressionListTag
      | ArrayConstructorTag,
  ): Type => {
    const recur = toType(context);
    switch (sql.tag) {
      case 'ArrayConstructor':
      case 'ExpressionList':
        return { type: 'Array', items: { type: 'Union', items: sql.values.map(recur) } };
      case 'ArrayColumnIndex':
        return { type: 'ArrayItem', value: recur(first(sql.values)) };
      case 'WrappedExpression':
        if (sql.values.length === 2) {
          switch (sql.values[1].tag) {
            case 'ArrayIndex':
              return { type: 'ArrayItem', value: recur(first(sql.values)) };
            case 'CompositeAccess':
              return {
                type: 'CompositeAccess',
                value: recur(first(sql.values)),
                name: sql.values[1].values[0].value,
                sourceTag: sql,
              };
          }
        } else {
          return recur(first(sql.values));
        }
      case 'TernaryExpression':
        return { type: 'Boolean', postgresType: 'bool' };
      case 'BinaryExpression':
        return toBinaryOperatorVariant(
          binaryOperatorTypes[sql.values[1].value],
          recur(sql.values[0]),
          recur(sql.values[2]),
          sql,
          2,
        );
      case 'Boolean':
        return { type: 'Boolean', literal: sql.value.toLowerCase() === 'true' ? true : false, postgresType: 'bool' };
      case 'Case':
        return { type: 'Union', items: sql.values.map((item) => recur(last(item.values))) };
      case 'CaseSimple':
        return { type: 'Union', items: tail(sql.values).map((item) => recur(last(item.values))) };
      case 'Cast':
      case 'PgCast':
        const castData = first(sql.values);
        const castType = recur(last(sql.values));
        return isColumn(castData) ? { type: 'LoadColumnCast', column: recur(castData), value: castType } : castType;
      case 'Column':
        const contextFromTable = context.from ? first(context.from.values) : undefined;
        return {
          type: 'LoadColumn',
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
            return { type: 'Coalesce', items: args };
          case 'greatest':
          case 'least':
            return { type: 'Named', name: functionName, value: args.find(isTypeConstant) ?? args[0] };
          case 'nullif':
            return { type: 'Union', items: [typeNull(), args[0]] };
          case 'array_agg':
            return { type: 'ToArray', items: args[0] ?? typeUnknown };
          case 'json_agg':
          case 'jsonb_agg':
            return { type: 'Array', items: args[0] ?? typeUnknown };
          case 'current_date':
            return typeDate('date');
          case 'current_timestamp':
            return typeDate('timestamp');
          case 'curtent_time':
            return typeString('time');
          case 'json_build_object':
          case 'jsonb_build_object':
            return {
              type: 'ObjectLiteral',
              items: chunk(2, args).flatMap(([name, type]) =>
                isTypeString(name) && name.literal ? { name: name.literal, type } : [],
              ),
            };
          default:
            return { type: 'LoadFunction', schema, name: functionName, args, sourceTag: sql };
        }
      case 'Null':
        return typeNull();
      case 'Number':
        return { type: 'Number', literal: Number(sql.value), postgresType: 'float4' };
      case 'Parameter':
        return typeAny();
      case 'Row':
      case 'RowKeyward':
        return { type: 'Named', value: typeString('row'), name: 'row' };
      case 'Select':
        return {
          type: 'Optional',
          nullable: true,
          value: recur(sql.values.filter(isSelectList)[0].values[0].values[0]),
        };
      case 'StarIdentifier':
        return {
          type: 'LoadStar',
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
        return { type: 'String', literal: sql.value, postgresType: 'text' };
      case 'Exists':
      case 'ComparationArray':
      case 'ComparationArrayInclusion':
        return typeBoolean();
      case 'Type':
        const typeParts = first(sql.values).values;
        const typeName = last(typeParts).value.toLowerCase();
        const typeSchema = typeParts.length === 2 ? typeParts[0].value : undefined;
        const pgType = toPgTypeConstant(typeName);
        return pgType
          ? { type: 'Named', name: pgTypeAliases[typeName] ?? typeName, value: pgType }
          : { type: 'LoadRecord', name: typeName, schema: typeSchema, sourceTag: sql };
      case 'ArrayType':
        return Array.from({ length: tail(sql.values).length }).reduce<Type>(
          (items) => ({ type: 'Array', items }),
          recur(first(sql.values)),
        );
      case 'TypedConstant':
        const typeConstantName = first(sql.values).value.toLowerCase();
        return {
          type: 'Named',
          name: pgTypeAliases[typeConstantName] ?? typeConstantName,
          value: toPgTypeConstant(typeConstantName) ?? typeUnknown(),
        };
      case 'Extract':
        return { type: 'Named', name: 'date_part', value: typeNumber() };
      case 'UnaryExpression':
        return unaryOperatorTypes[sql.values[0].value] ?? recur(sql.values[1]);
    }
  };

const toResultName = (type: Type): string => {
  switch (type.type) {
    case 'Coalesce':
      return 'coalesce';
    case 'Named':
      return type.name;
    case 'ArrayItem':
    case 'Optional':
      return toResultName(type.value);
    case 'Array':
    case 'ArrayConstant':
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
    case 'CompositeAccess':
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
          ...toParams({ ...context, type: coalesce(arg1Type, arg2Type) })(sql.values[0]),
          ...toParams({ ...context, type: coalesce(valueType, arg2Type) })(sql.values[2]),
          ...toParams({ ...context, type: coalesce(valueType, arg1Type) })(sql.values[4]),
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
              type: 'LoadColumn',
              column: first(sql.values).value,
              table: from.values.length === 2 ? from.values[1].value : from.values[0].value,
              schema: from.values.length === 2 ? from.values[0].value : undefined,
              sourceTag: first(sql.values),
            }
          : typeUnknown();
        return toParams({ ...context, type: setType })(last(sql.values));

      case 'BinaryExpression': {
        switch (sql.values[1].value) {
          case 'IN':
            return [
              ...toParams({ ...context, type: { type: 'ArrayItem', value: toTypeRecur(sql.values[2]) } })(
                sql.values[0],
              ),
              ...toParams({ ...context, type: { type: 'Array', items: toTypeRecur(sql.values[0]) } })(sql.values[2]),
            ];
          default:
            const operator = binaryOperatorTypes[sql.values[1].value];
            return [
              ...toParams({ ...context, type: operator.length === 1 ? operator[0][0] : toTypeRecur(sql.values[2]) })(
                sql.values[0],
              ),
              ...toParams({ ...context, type: operator.length === 1 ? operator[0][1] : toTypeRecur(sql.values[0]) })(
                sql.values[2],
              ),
            ];
        }
      }
      case 'Insert':
        const table = sql.values.filter(isTable)[0];
        const tableName = first(table.values);
        return sql.values.flatMap(
          toParams({
            ...context,
            columns: sql.values.filter(isColumns).flatMap((columns) =>
              columns.values.map((column) => ({
                type: 'LoadColumn',
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
                toParams({ ...context, type: { type: 'LoadFunctionArgument', ...argType, index, sourceTag: arg } })(
                  arg,
                ),
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
            pick: sql.pick.map((name, index) => ({ name: name.value, type: context.columns[index] ?? typeUnknown() })),
          },
        ];
      case 'ComparationArrayInclusion':
      case 'ComparationArray':
        const column = first(sql.values);
        return column && isColumn(column)
          ? [
              ...toParams({ ...context, type: { type: 'ArrayItem', value: toTypeRecur(last(sql.values)) } })(column),
              ...toParams({ ...context, type: { type: 'Array', items: toTypeRecur(column) } })(last(sql.values)),
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
        return toParams({ ...context, type: typeString() })(first(sql.values));
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
  const typeContext = { type: typeUnknown(), columns: [], from };

  return {
    sources: toSources(sql).concat(parentSources).filter(isRedundantSource),
    results: items.map(toResult(typeContext)),
    params: toParams(typeContext)(sql).filter(isUniqParam),
  };
};
