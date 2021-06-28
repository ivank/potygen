export const identity = <T>(item: T): T => item;
export const tail = <T>(items: T[]): T[] => items.slice(1);
export const isEmpty = <T>(items?: T[]): items is T[] => !items || items?.length === 0;
export const last = <T>(items?: T[]): T | undefined => items?.[items.length - 1];
export const first = <T>(items?: T[]): T | undefined => items?.[0];
export const initial = <T>(items: T[]): T[] => items.slice(0, -1);
export const isUnique = <T>(predicate: (item: T) => unknown = identity) => (
  item: T,
  index: number,
  items: T[],
): boolean => items.findIndex((current) => predicate(item) === predicate(current)) === index;
export const orderBy = <T>(predicate: (item: T) => any = identity) => (a: T, b: T): number => {
  const orderA = predicate(a);
  const orderB = predicate(b);
  return orderA === orderB ? 0 : orderA > orderB ? 1 : -1;
};
export const uniqBy = <T>(predicate: (item: T) => boolean, items: T[]): T[] => items.filter(isUnique(predicate));
