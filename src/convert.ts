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
} from './sql.types';

export type ColumnType = { table: string; column: string };
export type PropertyType = 'string' | 'number' | ColumnType;

export interface Property {
  name: string;
  type: PropertyType;
}

export interface StarProperty {
  table: string;
}

export interface QueryInterface {
  params: Property[];
  result: (Property | StarProperty)[];
}

const isEmpty = <T>(items?: T[]): items is T[] => !items || items?.length === 0;
const last = <T>(items?: T[]): T | undefined => items?.[items.length - 1];
const first = <T>(items?: T[]): T | undefined => items?.[0];
const initial = <T>(items: T[]): T[] => items?.slice(0, -1);
// const tail = <T>(items: T[]): T[] => items.slice(1);

const withResult = (query: QueryInterface, result: Property | StarProperty) => ({
  ...query,
  result: [...query.result, result],
});
// const withParam = (query: QueryInterface, param: Property) => ({ ...query, params: [...query.params, param] });

const toName = (aliases: Record<string, string>, values: IdentifierTag[]): string =>
  values.map((part) => aliases[part.value] ?? part.value).join('.');

const toTableAliases = (from: FromTag): Record<string, string> => {
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

export const convert = (query: QueryInterface, selectTag: SelectTag): QueryInterface => {
  const selectList = first(selectTag.values.filter(isSelectList));
  const from = first(selectTag.values.filter(isFrom));
  const tableAliases = from ? toTableAliases(from) : {};
  const fromTableExpression = first(from?.list.values)?.value;

  const fromTable = fromTableExpression && isQualifiedIdentifier(fromTableExpression) ? fromTableExpression.values : [];

  const resultQuery = selectList?.values.reduce((current, { value, as }) => {
    switch (value.tag) {
      case 'SelectIdentifier':
        const lastIdentifier = last(value.values);
        const selectPrefixIdentifiers = initial(value.values).filter(isIdentifier);
        const prefixIdentifiers =
          isEmpty(selectPrefixIdentifiers) && !isEmpty(fromTable) ? fromTable : selectPrefixIdentifiers;

        if (lastIdentifier) {
          return isStarIdentifier(lastIdentifier)
            ? withResult(current, { table: toName(tableAliases, prefixIdentifiers) })
            : withResult(current, {
                name: as?.value.value ?? lastIdentifier.value,
                type: { column: lastIdentifier.value, table: toName(tableAliases, prefixIdentifiers) },
              });
        }

        return current;
      default:
        return current;
    }
  }, query);

  return resultQuery ?? query;
};
