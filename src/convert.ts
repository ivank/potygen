import {
  FromTag,
  isFrom,
  isSelectList,
  isQualifiedIdentifier,
  SelectTag,
  isStarIdentifier,
  isIdentifier,
  isAs,
  ExpressionTag,
  isJoinOn,
} from './sql.types';

export type ColumnType = { type: 'column'; table: string[]; column: string };
export type StarType = { type: 'star'; table: string[] };
export type ConstantType = 'string' | 'number' | 'boolean' | 'Date';
export type SimpleType = ConstantType | ColumnType | StarType;
export type PropertyType = SimpleType[] | SimpleType;

export interface Property {
  name: string;
  type: PropertyType;
}

export interface Param {
  name: string;
  type: ConstantType;
}

export interface QueryInterface {
  params: Param[];
  result: Property[];
}

const isColumnType = (type: PropertyType): type is ColumnType => typeof type === 'object' && 'column' in type;

// const isUnion = <T>(type?: T[] | T): type is T[] => typeof type === 'object' && Array.isArray(type);
const isEmpty = <T>(items?: T[]): items is T[] => !items || items?.length === 0;
const last = <T>(items?: T[]): T | undefined => items?.[items.length - 1];
const first = <T>(items?: T[]): T | undefined => items?.[0];
const initial = <T>(items: T[]): T[] => items?.slice(0, -1);
// const tail = <T>(items: T[]): T[] => items.slice(1);

// const withResult = (query: QueryInterface, result: Property) => ({
//   ...query,
//   result: [...query.result, result],
// });
// const withParam = (query: QueryInterface, param: Property) => ({ ...query, params: [...query.params, param] });

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

const convertExpression = (tag: ExpressionTag): { type: PropertyType; params: Param[] } => {
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
    case 'BinaryExpression':
      const left = convertExpression(tag.left);
      const right = convertExpression(tag.right);
      return { type: left.type, params: left.params.concat(right.params) };
    case 'PgCast':
    case 'Cast':
      return { type: sqlTypes[tag.type.value] ?? 'string', params: convertExpression(tag.value).params };
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
      return { type: 'string', params: [{ name: tag.value, type: 'string' }] };
  }
};

const resolveProperty = (fromTable: string[], aliases: Record<string, string[]>) => (prop: SimpleType): SimpleType =>
  typeof prop === 'object' ? { ...prop, table: isEmpty(prop.table) ? fromTable : toName(aliases, prop.table) } : prop;

export const convertSelect = (selectTag: SelectTag): QueryInterface => {
  const selectList = first(selectTag.values.filter(isSelectList));
  const from = first(selectTag.values.filter(isFrom));
  const tableAliases = from ? toTableAliases(from) : {};
  const fromTableExpression = first(from?.list.values)?.value;

  const fromTable =
    fromTableExpression && isQualifiedIdentifier(fromTableExpression)
      ? fromTableExpression.values.map((table) => table.value)
      : [];

  const resolvePropertyWithAliases = resolveProperty(fromTable, tableAliases);

  const result =
    selectList?.values.map(({ value, as }) => {
      const property = convertExpression(value);

      const type = Array.isArray(property.type)
        ? property.type.map(resolvePropertyWithAliases)
        : resolvePropertyWithAliases(property.type);

      const name =
        as?.value.value ?? (isColumnType(type) ? type.column : value.tag === 'Boolean' ? 'bool' : '?column?');

      return { name, type };
    }) ?? [];

  const params = selectTag.values.reduce<Param[]>((current, tag) => {
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
      default:
        return current;
    }
  }, []);

  return { params, result };
};
