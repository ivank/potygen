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
  TableTag,
} from '@psql-ts/ast';
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
import { isTypeConstant } from './query-interface.guards';
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
        const name = sql.as?.value ?? sql.table;
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
          ...recur(sql.value),
          { type: 'Query', sourceTag: sql, name: sql.as.value.value, value: {} as any },
        ]);
      case 'SubqueryExpression':
        return sources.concat(nestedRecur(sql.subquery));
      case 'BinaryExpression':
        return sources.concat(recur(sql.left), recur(sql.right));
      case 'Select':
      case 'Delete':
      case 'Update':
      case 'Insert':
      case 'Using':
      case 'UpdateFrom':
      case 'Combination':
        return sources.concat(sql.values.flatMap(recur));
      case 'From':
        return sources.concat(
          sql.list.values.flatMap(recur),
          sql.join.flatMap((join) => recur(join.table)),
        );
      case 'Where':
      case 'Having':
      case 'UnaryExpression':
        return sources.concat(recur(sql.value));
      case 'CTE':
        return sources.concat({ type: 'Query', sourceTag: sql, name: sql.name.value, value: {} as any });
      case 'With':
        return sources.concat(sql.ctes.flatMap(nestedRecur), recur(sql.value));
      default:
        return sources;
    }
  };

export const isTypeEqual = (a: Type, b: Type): boolean =>
  a.type === 'Any' || b.type === 'Any' ? true : a.type === 'Unknown' || b.type === 'Unknown' ? false : isEqual(a, b);

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
  (sql: ExpressionTag | StarIdentifierTag | TypeArrayTag | TypeTag): Type => {
    const recur = toType(context);
    switch (sql.tag) {
      case 'ArrayIndex':
      case 'WrappedExpression':
        return recur(sql.value);
      case 'Between':
        return { type: 'Boolean' };
      case 'BinaryExpression':
        return toBinaryOperatorVariant(
          binaryOperatorTypes[sql.operator.value],
          recur(sql.left),
          recur(sql.right),
          sql,
          2,
        );
      case 'Boolean':
        return { type: 'Boolean', literal: sql.value.toLowerCase() === 'true' ? true : false };
      case 'Case':
        return { type: 'Union', items: sql.values.map((item) => recur(item.value)) };
      case 'Cast':
      case 'PgCast':
        return isColumn(sql.value)
          ? { type: 'Named', name: sql.value.name.value, value: recur(sql.type) }
          : recur(sql.type);
      case 'Column':
        return {
          type: 'LoadColumn',
          column: sql.name.value,
          table: sql.table?.value ?? context.from?.table.value,
          schema: sql.schema?.value ?? context.from?.schema?.value,
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
        return {
          type: 'LoadFunction',
          name: sql.value.value.toLowerCase(),
          args: sql.args.filter(isExpression).map(recur),
          sourceTag: sql,
        };
      case 'Null':
        return typeNull;
      case 'NullIfTag':
        return { type: 'Union', items: [typeNull, recur(sql.value)] };
      case 'Number':
        return { type: 'Number', literal: Number(sql.value) };
      case 'Parameter':
        return typeAny;
      case 'Row':
        return { type: 'Named', value: typeString, name: 'row' };
      case 'Select':
        return recur(sql.values.filter(isSelectList)[0].values[0].value);
      case 'StarIdentifier':
        return { type: 'LoadStar', table: sql.table?.value, schema: sql.schema?.value, sourceTag: sql };
      case 'String':
        return { type: 'String', literal: sql.value };
      case 'SubqueryExpression':
        return typeBoolean;
      case 'Type':
        return sqlTypes[sql.value] ?? { type: 'LoadRecord', name: sql.value.toLowerCase() };
      case 'TypeArray':
        return Array.from({ length: sql.dimensions }).reduce<Type>(
          (items) => ({ type: 'Array', items }),
          recur(sql.value),
        );
      case 'UnaryExpression':
        return unaryOperatorTypes[sql.operator.value] ?? recur(sql.value);
    }
  };

const toResultName = (type: Type): string => {
  switch (type.type) {
    case 'Coalesce':
      return 'coalesce';
    case 'Named':
      return type.name;
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
    const type = toType(context)(sql.value);
    return { name: sql.as?.value.value ?? toResultName(type), type: toType(context)(sql.value) };
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
      return toQueryResults(sql.value);
    }
  }
};

export const toParams =
  (context: TypeContext) =>
  (sql: Tag): Param[] => {
    const recur = toParams(context);
    const toTypeRecur = toType(context);
    switch (sql.tag) {
      case 'ArrayIndex':
        return recur(sql.value).concat(recur(sql.index));
      case 'Between': {
        const rightType = toTypeRecur(sql.right);
        const leftType = toTypeRecur(sql.left);
        const valueType = toTypeRecur(sql.value);
        return [
          ...toParams({ ...context, type: coalesce(leftType, rightType) })(sql.value),
          ...toParams({ ...context, type: coalesce(valueType, rightType) })(sql.left),
          ...toParams({ ...context, type: coalesce(valueType, leftType) })(sql.right),
        ];
      }
      case 'BinaryExpression': {
        switch (sql.operator.value) {
          case 'IN':
            return [
              ...toParams({ ...context, type: { type: 'ArrayItem', value: toTypeRecur(sql.right) } })(sql.left),
              ...toParams({ ...context, type: { type: 'Array', items: toTypeRecur(sql.left) } })(sql.right),
            ];
          default:
            const operator = binaryOperatorTypes[sql.operator.value];
            return [
              ...toParams({ ...context, type: operator.length === 1 ? operator[0][0] : toTypeRecur(sql.right) })(
                sql.left,
              ),
              ...toParams({ ...context, type: operator.length === 1 ? operator[0][1] : toTypeRecur(sql.left) })(
                sql.right,
              ),
            ];
        }
      }
      case 'Case':
        return sql.values.flatMap(recur).concat(sql.expression ? recur(sql.expression) : []);
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
      case 'Count':
        return typeof sql.value === 'string' ? [] : recur(sql.value);
      case 'DoUpdate':
        return recur(sql.value).concat(sql.where ? recur(sql.where) : []);
      case 'From':
        return recur(sql.list).concat(sql.join.flatMap(recur));
      case 'Function':
        return sql.args
          .filter(isExpression)
          .flatMap((arg, index) =>
            toParams({
              ...context,
              type: {
                type: 'LoadFunctionArgument',
                args: sql.args.filter(isExpression).map(toTypeRecur),
                name: sql.value.value.toLowerCase(),
                index,
                sourceTag: arg,
              },
            })(arg),
          )
          .concat(sql.args.filter(isOrderBy).flatMap(recur));
      case 'NullIfTag':
        return recur(sql.value).concat(recur(sql.conditional));
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
        return recur(sql.values);
      case 'SubqueryExpression':
        return recur(sql.subquery);
      case 'UnaryExpression':
        return toParams({ ...context, type: unaryOperatorTypes[sql.operator.value] })(sql.value);
      case 'ValuesList':
        return sql.values
          .filter(isValues)
          .flatMap((item) =>
            item.values.flatMap((column, index) =>
              isDefault(column) ? [] : toParams({ ...context, type: context.columns[index] })(column),
            ),
          )
          .concat(sql.values.filter(isParameter).flatMap(recur));
      case 'When':
        return recur(sql.value).concat(recur(sql.condition));
      case 'With':
        return recur(sql.value).concat(sql.ctes.flatMap(recur));
      case 'PgCast':
      case 'Cast':
        return toParams({ ...context, type: toTypeRecur(sql.type) })(sql.value);
      case 'Limit':
      case 'Offset':
        return toParams({ ...context, type: typeString })(sql.value);
      case 'Else':
      case 'Filter':
      case 'Having':
      case 'JoinOn':
      case 'NamedSelect':
      case 'OrderByItem':
      case 'ReturningListItem':
      case 'SelectListItem':
      case 'Set':
      case 'SetItem':
      case 'Where':
      case 'CTE':
      case 'WrappedExpression':
        return recur(sql.value);
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
        return sql.values.flatMap(recur);
      case 'Null':
      case 'Number':
      case 'String':
      case 'Boolean':
      case 'ArrayIndexRange':
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
      case 'Number':
      case 'OrderDirection':
      case 'Collate':
      case 'QuotedName':
      case 'Star':
      case 'StarIdentifier':
      case 'String':
      case 'SubqueryOperator':
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
