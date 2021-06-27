import {
  FromTag,
  isFrom,
  isSelectList,
  isQualifiedIdentifier,
  SelectTag,
  isStarIdentifier,
  IdentifierTag,
  isIdentifier,
  isAs,
  ExpressionTag,
} from './sql.types';

export type ColumnType = { type: 'column'; table: IdentifierTag[]; column: string };
export type StarType = { type: 'star'; table: IdentifierTag[] };
export type ConstantType = 'string' | 'number' | 'boolean' | 'Date';
export type SimpleType = ConstantType | ColumnType | StarType;
export type PropertyType = SimpleType[] | SimpleType;

export interface Property {
  name: string;
  type: PropertyType;
}

export interface QueryInterface {
  params: Property[];
  result: Property[];
}

const isColumnType = (type: PropertyType): type is ColumnType => typeof type === 'object' && 'column' in type;

// const isEmpty = <T>(items?: T[]): items is T[] => !items || items?.length === 0;
const last = <T>(items?: T[]): T | undefined => items?.[items.length - 1];
const first = <T>(items?: T[]): T | undefined => items?.[0];
const initial = <T>(items: T[]): T[] => items?.slice(0, -1);
// const tail = <T>(items: T[]): T[] => items.slice(1);

const withResult = (query: QueryInterface, result: Property) => ({
  ...query,
  result: [...query.result, result],
});
// const withParam = (query: QueryInterface, param: Property) => ({ ...query, params: [...query.params, param] });

const toName = (aliases: Record<string, IdentifierTag[]>, values: IdentifierTag[]): IdentifierTag[] =>
  values.flatMap((part) => aliases[part.value] ?? part.value);

const toTableAliases = (from: FromTag): Record<string, IdentifierTag[]> => {
  const fromAliases = from.list.values.reduce((current, item) => {
    const alias = item.as?.value.value;
    return alias && isQualifiedIdentifier(item.value)
      ? { ...current, [alias]: toName(current, item.value.values) }
      : current;
  }, {});

  return from.join.reduce((current, item) => {
    const alias = first(item.values.filter(isAs))?.value.value;
    return alias ? { ...current, [alias]: toName(current, item.table.values) } : current;
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

const convertExpression = (tag: ExpressionTag): PropertyType => {
  switch (tag.tag) {
    case 'SelectIdentifier':
      const lastIdentifier = last(tag.values);
      const prefixIdentifiers = initial(tag.values).filter(isIdentifier);

      return lastIdentifier
        ? isStarIdentifier(lastIdentifier)
          ? { type: 'star', table: prefixIdentifiers }
          : { type: 'column', column: lastIdentifier.value, table: prefixIdentifiers }
        : 'string';

    case 'Select':
      return convertSelect({ params: [], result: [] }, tag).result[0].type;
    case 'BinaryExpression':
      return convertExpression(tag.left);
    case 'PgCast':
      return sqlTypes[tag.type.value] ?? 'string';
    case 'Cast':
      return sqlTypes[tag.type.value] ?? 'string';
    case 'Case':
      return tag.values.flatMap((caseTag) => convertExpression(caseTag.value));
    case 'Boolean':
      return 'boolean';
    case 'String':
    case 'Number':
    case 'Between':
      return 'string';
    case 'Parameter':
      return 'string';
  }
};

const resolveProperty = (fromTable: IdentifierTag[], aliases: Record<string, IdentifierTag[]>) => (
  prop: SimpleType,
): SimpleType =>
  typeof prop === 'object' ? { ...prop, table: prop.table ? toName(aliases, prop.table) : fromTable } : prop;

export const convertSelect = (query: QueryInterface, selectTag: SelectTag): QueryInterface => {
  const selectList = first(selectTag.values.filter(isSelectList));
  const from = first(selectTag.values.filter(isFrom));
  const tableAliases = from ? toTableAliases(from) : {};
  const fromTableExpression = first(from?.list.values)?.value;

  const fromTable = fromTableExpression && isQualifiedIdentifier(fromTableExpression) ? fromTableExpression.values : [];

  const resolvePropertyWithAliases = resolveProperty(fromTable, tableAliases);

  const resultQuery = selectList?.values.reduce<QueryInterface>((current, { value, as }) => {
    const property = convertExpression(value);

    const type = Array.isArray(property)
      ? property.map(resolvePropertyWithAliases)
      : resolvePropertyWithAliases(property);

    const name = as?.value.value ?? (isColumnType(type) ? type.column : value.tag === 'Boolean' ? 'bool' : '?column?');

    return withResult(current, { name, type });
  }, query);

  return resultQuery ?? query;
};
