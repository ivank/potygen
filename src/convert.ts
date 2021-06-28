import { first, last, initial, isEmpty, isUnique, orderBy } from './util';
import {
  FromTag,
  isFrom,
  isSelectList,
  isQualifiedIdentifier,
  isStarIdentifier,
  isIdentifier,
  isAs,
  ExpressionTag,
  isJoinOn,
  CombinationTag,
  DistinctTag,
  GroupByTag,
  HavingTag,
  LimitTag,
  OffsetTag,
  OrderByTag,
  SelectListTag,
  WhereTag,
} from './sql.types';

export type ColumnType = { type: 'column'; table: string[]; column: string };
export type StarType = { type: 'star'; table: string[] };
export type ConstantType = 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'unknown';
export type SimpleType = ConstantType | ColumnType | StarType;
export type PropertyType = SimpleType[] | SimpleType;

export interface Property {
  name: string;
  type: PropertyType;
}

export interface Param {
  name: string;
  type: PropertyType;
}

export interface QueryInterface {
  params: Param[];
  result: Property[];
}

const isColumnType = (type: PropertyType): type is ColumnType => typeof type === 'object' && 'column' in type;

const toName = (aliases: Record<string, string[]>, values: string[]): string[] =>
  values.flatMap((part) => aliases[part] ?? part);

const toTableAliases = (from: FromTag): Record<string, string[]> => {
  const fromAliases = from.list.values.reduce((current, item) => {
    const alias = item.as?.value.value;
    return alias && isQualifiedIdentifier(item.value)
      ? {
          ...current,
          [alias]: toName(
            current,
            item.value.values.map((table) => table.value),
          ),
        }
      : current;
  }, {});

  return from.join.reduce((current, item) => {
    const alias = first(item.values.filter(isAs))?.value.value;
    return alias
      ? {
          ...current,
          [alias]: toName(
            current,
            item.table.values.map((table) => table.value),
          ),
        }
      : current;
  }, fromAliases);
};

const sqlTypes: { [type: string]: ConstantType } = {
  bigint: 'number',
  int8: 'number',
  bigserial: 'number',
  serial8: 'number',
  boolean: 'boolean',
  bool: 'boolean',
  date: 'Date',
  'double precision': 'number',
  float8: 'number',
  integer: 'number',
  int4: 'number',
  int: 'number',
  smallint: 'number',
  smallserial: 'number',
  serial4: 'number',
  serial: 'number',
  timestamp: 'Date',
  timetz: 'Date',
  timestamptz: 'Date',
};

const operatorTypes: { [type: string]: ConstantType } = {
  '+': 'number',
  '-': 'number',
  '/': 'number',
  '*': 'number',
  OR: 'boolean',
  AND: 'boolean',
  NOT: 'boolean',
  '||': 'string',
};

const convertExpression = (
  tag: ExpressionTag,
  contextType?: Param['type'],
): { type: PropertyType; params: Param[] } => {
  switch (tag.tag) {
    case 'SelectIdentifier':
      const lastIdentifier = last(tag.values);
      const prefixIdentifiers = initial(tag.values).filter(isIdentifier);

      return {
        type: lastIdentifier
          ? isStarIdentifier(lastIdentifier)
            ? { type: 'star', table: prefixIdentifiers.map((table) => table.value) }
            : { type: 'column', column: lastIdentifier.value, table: prefixIdentifiers.map((table) => table.value) }
          : 'string',
        params: [],
      };

    case 'Select':
      const select = convertSelect(tag);
      return { type: select.result[0].type, params: select.params };

    case 'Null':
      return { type: 'null', params: [] };

    case 'UnaryExpression':
      const unary = convertExpression(tag.value);
      const unaryOperatorType = operatorTypes[tag.operator.value.toUpperCase()];
      const param = convertExpression(tag.value, unaryOperatorType ?? unary.type);

      return { type: unary.type, params: param.params };

    case 'BinaryExpression':
      const left = convertExpression(tag.left);
      const right = convertExpression(tag.right);
      const binaryOperatorType = operatorTypes[tag.operator.value.toUpperCase()];
      const paramLeft = convertExpression(tag.left, binaryOperatorType ?? right.type);
      const paramRight = convertExpression(tag.right, binaryOperatorType ?? left.type);
      return { type: left.type, params: paramLeft.params.concat(paramRight.params) };

    case 'PgCast':
    case 'Cast':
      const castType = sqlTypes[tag.type.value] ?? 'string';
      return { type: sqlTypes[tag.type.value] ?? 'string', params: convertExpression(tag.value, castType).params };

    case 'Case':
      return tag.values.reduce<{ type: SimpleType[]; params: Param[] }>(
        (acc, caseTag) => {
          const caseRes = convertExpression(caseTag.value);
          return { params: caseRes.params, type: acc.type.concat(caseRes.type) };
        },
        { params: [], type: [] },
      );

    case 'Boolean':
      return { type: 'boolean', params: [] };

    case 'Number':
      return { type: 'number', params: [] };

    case 'String':
    case 'Between':
      return { type: 'string', params: [] };

    case 'Parameter':
      return { type: 'string', params: [{ name: tag.value, type: contextType ?? 'unknown' }] };
  }
};

const resolveTypeWith = (fromTable: string[], aliases: Record<string, string[]>) => (prop: SimpleType): SimpleType =>
  typeof prop === 'object' ? { ...prop, table: isEmpty(prop.table) ? fromTable : toName(aliases, prop.table) } : prop;

const resolveType = (fromTable: string[], aliases: Record<string, string[]>) => {
  const resolve = resolveTypeWith(fromTable, aliases);
  return (property: SimpleType | SimpleType[]): SimpleType | SimpleType[] => {
    return Array.isArray(property) ? property.map(resolve) : resolve(property);
  };
};

export const convertSelect = (selectTag: {
  tag: 'Combination' | 'Select';
  values: (
    | DistinctTag
    | SelectListTag
    | FromTag
    | WhereTag
    | GroupByTag
    | HavingTag
    | OrderByTag
    | CombinationTag
    | LimitTag
    | OffsetTag
  )[];
}): QueryInterface => {
  const selectList = first(selectTag.values.filter(isSelectList));
  const from = first(selectTag.values.filter(isFrom));
  const tableAliases = from ? toTableAliases(from) : {};
  const fromTableExpression = first(from?.list.values)?.value;

  const fromTable =
    fromTableExpression && isQualifiedIdentifier(fromTableExpression)
      ? fromTableExpression.values.map((table) => table.value)
      : [];

  const resolve = resolveType(fromTable, tableAliases);

  const result =
    selectList?.values.map(({ value, as }) => {
      const property = convertExpression(value);
      const type = resolve(property.type);
      const name =
        as?.value.value ?? (isColumnType(type) ? type.column : value.tag === 'Boolean' ? 'bool' : '?column?');

      return { name, type };
    }) ?? [];

  const params = selectTag.values
    .reduce<Param[]>((current, tag) => {
      switch (tag.tag) {
        case 'SelectList':
          return current.concat(tag.values.flatMap((item) => convertExpression(item.value).params));
        case 'From':
          return current.concat(
            tag.join.flatMap((item) =>
              item.values.filter(isJoinOn).flatMap((join) => convertExpression(join.value).params),
            ),
          );
        case 'Where':
        case 'Having':
          return current.concat(convertExpression(tag.value).params);
        case 'Combination':
          return current.concat(convertSelect(tag).params);
        default:
          return current;
      }
    }, [])
    .sort(orderBy((item) => (item.type === 'unknown' ? 3 : item.type === 'null' ? 2 : 1)))
    .filter(isUnique((item) => item.name))
    .map((param) => ({ ...param, type: resolve(param.type) }));

  return { params, result };
};
