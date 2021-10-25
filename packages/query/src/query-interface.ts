import {
  ExpressionTag,
  isSelectList,
  isTable,
  SelectListItemTag,
  StarIdentifierTag,
  TypeArrayTag,
  Tag,
  TypeTag,
  isExpression,
  isReturning,
  ReturningListItemTag,
  SelectTag,
  UpdateTag,
  InsertTag,
  DeleteTag,
  WithTag,
  isOrderBy,
  isValues,
  isDefault,
  isParameter,
  isColumns,
  isColumn,
  isEqual,
  chunk,
  ArrayConstructorTag,
  TableTag,
  first,
  last,
  initial,
  tail,
} from '@psql-ts/ast';
import { isFilter } from '@psql-ts/ast/dist/grammar.guards';
import { ExpressionListTag } from '@psql-ts/ast/dist/grammar.types';
import {
  typeUnknown,
  binaryOperatorTypes,
  unaryOperatorTypes,
  typeNull,
  typeString,
  typeBoolean,
  sqlTypes,
  typeAny,
} from './query-interface-type-instances';
import { isTypeConstant, isTypeString } from './query-interface.guards';
import {
  Type,
  Param,
  Source,
  QueryInterface,
  TypeConstant,
  TypeLoadOperator,
  Result,
  TypeContext,
} from './query-interface.types';

const toSources =
  (sources: Source[] = [], isResult = true) =>
  (sql: Tag): Source[] => {
    const nestedRecur = toSources(sources, false);
    const recur = toSources(sources, isResult);
    switch (sql.tag) {
      case 'Table':
        const name = sql.as ? first(sql.as.values) : sql.table;
        return sources.concat({
          type: 'Table',
          isResult,
          sourceTag: sql,
          name: name.value,
          schema: sql.schema?.value,
          table: sql.table.value,
        });
      case 'NamedSelect':
        return sources.concat([
          ...recur(first(sql.values)),
          {
            type: 'Query',
            sourceTag: sql,
            name: first(last(sql.values).values).value,
            value: toQueryInterface(first(sql.values)),
          },
        ]);
      case 'ComparationExpression':
        return sources.concat(nestedRecur(last(sql.values)));
      case 'BinaryExpression':
      case 'UnaryExpression':
      case 'Select':
      case 'Delete':
      case 'Update':
      case 'Insert':
      case 'Using':
      case 'UpdateFrom':
      case 'Combination':
      case 'SelectList':
      case 'FromList':
      case 'SelectListItem':
      case 'Join':
      case 'From':
      case 'Where':
      case 'Having':
        return sources.concat(sql.values.flatMap(recur));
      case 'CTE':
        return sources.concat({
          type: 'Query',
          sourceTag: sql,
          name: first(sql.values).value,
          value: toQueryInterface(last(sql.values)),
        });
      case 'With':
        return sources.concat(initial(sql.values).flatMap(nestedRecur), recur(last(sql.values)));
      default:
        return sources;
    }
  };

export const isTypeEqual = (a: Type, b: Type): boolean => {
  if (a.type === 'Any' || b.type === 'Any') {
    return true;
  } else if (a.type === 'Unknown' || b.type === 'Unknown') {
    return false;
  } else if ((a.type === 'Array' && b.type === 'Array') || (a.type === 'ArrayConstant' && b.type === 'ArrayConstant')) {
    return isTypeEqual(a.items, b.items);
  } else if ((a.type === 'Union' && b.type === 'Union') || (a.type === 'UnionConstant' && b.type === 'UnionConstant')) {
    return a.items.every((aItem) => b.items.some((bItem) => isTypeEqual(aItem, bItem)));
  } else {
    return isEqual(a, b);
  }
};

const coalesce = (...types: Type[]): Type => types.find((item) => item.type !== 'Unknown') ?? typeUnknown;

export const toContantBinaryOperatorVariant = (
  availableTypes: Array<[TypeConstant, TypeConstant, TypeConstant]>,
  left: TypeConstant,
  right: TypeConstant,
  index: 0 | 1 | 2,
): TypeConstant => {
  const filsteredAvailableTypes = availableTypes.filter(
    (type) => isTypeEqual(type[0], left) || isTypeEqual(type[1], right),
  );

  return filsteredAvailableTypes.length === 1 ? filsteredAvailableTypes[0][index] : { type: 'Unknown' };
};

const toBinaryOperatorVariant = (
  availableTypes: Array<[TypeConstant, TypeConstant, TypeConstant]>,
  left: Type,
  right: Type,
  sourceTag: Tag,
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
      | TypeArrayTag
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
      case 'ArrayIndex':
        return { type: 'ArrayItem', value: recur(first(sql.values)) };
      case 'WrappedExpression':
        return recur(sql.value);
      case 'Between':
        return { type: 'Boolean' };
      case 'BinaryExpression':
        return toBinaryOperatorVariant(
          binaryOperatorTypes[sql.values[1].value],
          recur(sql.values[0]),
          recur(sql.values[2]),
          sql,
          2,
        );
      case 'Boolean':
        return { type: 'Boolean', literal: sql.value.toLowerCase() === 'true' ? true : false };
      case 'Case':
        return { type: 'Union', items: sql.values.map((item) => recur(last(item.values))) };
      case 'CaseSimple':
        return { type: 'Union', items: tail(sql.values).map((item) => recur(last(item.values))) };
      case 'Cast':
      case 'PgCast':
        const castData = first(sql.values);
        const castType = recur(last(sql.values));
        return isColumn(castData) ? { type: 'Named', name: last(castData.values).value, value: castType } : castType;
      case 'Column':
        return {
          type: 'LoadColumn',
          column: last(sql.values).value,
          table:
            sql.values.length === 3
              ? sql.values[1].value
              : sql.values.length === 2
              ? sql.values[0].value
              : context.from?.table.value,
          schema: sql.values.length === 3 ? sql.values[0].value : context.from?.schema?.value,
          sourceTag: sql,
        };
      case 'ConditionalExpression':
        const conditionalTypes = sql.values.map(recur);
        return sql.type === 'COALESCE'
          ? { type: 'Coalesce', items: conditionalTypes }
          : {
              type: 'Named',
              name: sql.type.toLowerCase(),
              value: conditionalTypes.find(isTypeConstant) ?? conditionalTypes[0],
            };
      case 'Function':
        const functionName = first(sql.values).value.toLowerCase();
        const args = sql.values.filter(isExpression).map(recur);
        switch (functionName) {
          case 'array_agg':
            return { type: 'ToArray', items: args[0] ?? typeUnknown };
          case 'json_agg':
          case 'jsonb_agg':
            return { type: 'Array', items: args[0] ?? typeUnknown };
          case 'json_build_object':
          case 'jsonb_build_object':
            return {
              type: 'ObjectLiteral',
              items: chunk(2, args).flatMap(([name, type]) =>
                isTypeString(name) && name.literal ? { name: name.literal, type } : [],
              ),
            };
          default:
            return { type: 'LoadFunction', name: functionName, args, sourceTag: sql };
        }
      case 'Null':
        return typeNull;
      case 'NullIfTag':
        return { type: 'Union', items: [typeNull, recur(first(sql.values))] };
      case 'Number':
        return { type: 'Number', literal: Number(sql.value) };
      case 'Parameter':
        return typeAny;
      case 'Row':
        return { type: 'Named', value: typeString, name: 'row' };
      case 'Select':
        return recur(sql.values.filter(isSelectList)[0].values[0].values[0]);
      case 'StarIdentifier':
        return {
          type: 'LoadStar',
          table:
            sql.values.length === 3 ? sql.values[1].value : sql.values.length === 2 ? sql.values[0].value : undefined,
          schema: sql.values.length === 3 ? sql.values[0].value : undefined,
          sourceTag: sql,
        };
      case 'String':
        return { type: 'String', literal: sql.value };
      case 'ComparationExpression':
        return typeBoolean;
      case 'Type':
        return sqlTypes[sql.value] ?? { type: 'LoadRecord', name: sql.value.toLowerCase() };
      case 'TypeArray':
        return Array.from({ length: sql.value }).reduce<Type>(
          (items) => ({ type: 'Array', items }),
          recur(first(sql.values)),
        );
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
      return toResultName(type.value);
    case 'Array':
    case 'ArrayConstant':
      return 'array';
    case 'Boolean':
      return 'bool';
    case 'LoadColumn':
      return type.column;
    case 'LoadFunction':
      return type.name;
    case 'LoadRecord':
      return 'row';
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

const toQueryResults = (
  sql: SelectTag | UpdateTag | InsertTag | DeleteTag | WithTag,
): { from?: TableTag; items: Array<SelectListItemTag | ReturningListItemTag> } => {
  switch (sql.tag) {
    case 'Select':
      return {
        items: sql.values.filter(isSelectList).flatMap((list) => list.values),
      };
    case 'Update':
      return {
        from: sql.values.filter(isTable)[0],
        items: sql.values.filter(isReturning).flatMap((item) => item.values),
      };
    case 'Insert':
      return {
        from: sql.values.filter(isTable)[0],
        items: sql.values.filter(isReturning).flatMap((item) => item.values),
      };
    case 'Delete':
      return {
        from: sql.values.filter(isTable)[0],
        items: sql.values.filter(isReturning).flatMap((item) => item.values),
      };
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
      case 'Between': {
        const toType = toTypeRecur(sql.values[2]);
        const fromType = toTypeRecur(sql.values[1]);
        const valueType = toTypeRecur(sql.values[0]);
        return [
          ...toParams({ ...context, type: coalesce(fromType, toType) })(sql.values[0]),
          ...toParams({ ...context, type: coalesce(valueType, toType) })(sql.values[1]),
          ...toParams({ ...context, type: coalesce(valueType, fromType) })(sql.values[2]),
        ];
      }
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
        return sql.values.flatMap(
          toParams({
            ...context,
            columns: sql.values.filter(isColumns).flatMap((columns) =>
              columns.values.map((column) => ({
                type: 'LoadColumn',
                column: column.value,
                table: table.table.value,
                schema: table.schema?.value,
                sourceTag: sql,
              })),
            ),
          }),
        );
      case 'DoUpdate':
        return recur(sql.value).concat(sql.where ? recur(sql.where) : []);
      case 'Function':
        const args = sql.values.filter(isExpression);
        const argType = { args: args.map(toTypeRecur), name: first(sql.values).value.toLowerCase() };

        return args
          .flatMap((arg, index) =>
            toParams({ ...context, type: { type: 'LoadFunctionArgument', ...argType, index, sourceTag: arg } })(arg),
          )
          .concat(sql.values.filter(isOrderBy).flatMap(recur), sql.values.filter(isFilter).flatMap(recur));
      case 'Parameter':
        return [
          {
            name: sql.value,
            pos: sql.pos,
            nextPos: sql.nextPos,
            spread: sql.type === 'spread',
            required: sql.required || sql.pick.length > 0,
            type: context.type,
            pick: sql.pick.map((name, index) => ({ name: name.value, type: context.columns[index] ?? typeUnknown })),
          },
        ];
      case 'SetMap':
        return recur(sql.value);
      case 'ComparationExpression':
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
        return toParams({ ...context, type: typeString })(sql.value);
      case 'OrderByItem':
      case 'Set':
      case 'SetItem':
      case 'WrappedExpression':
        return recur(sql.value);
      case 'Having':
      case 'Where':
      case 'From':
      case 'JoinOn':
      case 'NamedSelect':
      case 'ReturningListItem':
      case 'SelectListItem':
      case 'Filter':
      case 'Combination':
      case 'ConditionalExpression':
      case 'ArrayConstructor':
      case 'Conflict':
      case 'ConflictTarget':
      case 'Delete':
      case 'FromList':
      case 'Join':
      case 'OrderBy':
      case 'Returning':
      case 'Row':
      case 'Select':
      case 'SelectList':
      case 'SetList':
      case 'Update':
      case 'UpdateFrom':
      case 'Using':
      case 'Values':
      case 'ExpressionList':
      case 'CTE':
      case 'With':
      case 'ArrayIndexRange':
      case 'ArrayIndex':
      case 'Count':
      case 'Case':
      case 'CaseSimple':
      case 'Else':
      case 'When':
      case 'NullIfTag':
        return sql.values.flatMap(recur);
      case 'Null':
      case 'Number':
      case 'Integer':
      case 'String':
      case 'Boolean':
      case 'BinaryOperator':
      case 'As':
      case 'Cast':
      case 'Collate':
      case 'Column':
      case 'Columns':
      case 'ConflictConstraint':
      case 'Default':
      case 'Distinct':
      case 'DoNothing':
      case 'GroupBy':
      case 'Identifier':
      case 'JoinType':
      case 'JoinUsing':
      case 'Null':
      case 'OrderDirection':
      case 'Collate':
      case 'QuotedName':
      case 'Star':
      case 'StarIdentifier':
      case 'String':
      case 'ComparationOperator':
      case 'ComparationType':
      case 'Table':
      case 'Type':
      case 'TypeArray':
      case 'UnaryOperator':
      case 'Name':
        return [];
    }
  };

const isUniqParam = (item: Param, index: number, all: Param[]) =>
  all.findIndex((current) => item.name === current.name && isEqual(item.type, current.type)) === index;

export const toQueryInterface = (sql: SelectTag | UpdateTag | InsertTag | DeleteTag | WithTag): QueryInterface => {
  const { from, items } = toQueryResults(sql);
  const typeContext = { type: typeUnknown, columns: [], from };

  return {
    sources: toSources()(sql),
    results: items.map(toResult(typeContext)),
    params: toParams(typeContext)(sql).filter(isUniqParam),
  };
};
