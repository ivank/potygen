export const length = (item: unknown): number | undefined => (Array.isArray(item) ? item.length : undefined);

export const identity = <T>(item: T): T => item;

export const isEmpty = <T>(items?: T[]): boolean => !items || items?.length === 0;

export function tail<T>(items: [unknown, ...T[]]): T[];
export function tail<T>(items: T[]): T[];
export function tail<T>(items: T[]): T[] {
  return items.slice(1);
}

export function last<T>(items?: [...unknown[], T]): T;
export function last<T>(items?: T[]): T | undefined;
export function last<T>(items?: T[]): T | undefined {
  return items?.[items.length - 1];
}

export function first<T>(items?: [T, ...unknown[]]): T;
export function first<T>(items?: T[]): T | undefined;
export function first<T>(items?: T[]): T | undefined {
  return items?.[0];
}

export function initial<T>(items: [...T[], unknown]): T[];
export function initial<T>(items: T[]): T[];
export function initial<T>(items: T[]): T[] {
  return items.slice(0, -1);
}

export const isUnique =
  <T>(predicate: (item: T) => unknown = identity) =>
  (item: T, index: number, items: T[]): boolean =>
    items.findIndex((current) => predicate(item) === predicate(current)) === index;

export const isUniqueBy =
  <T>(predicate: (a: T, b: T) => boolean = isEqual) =>
  (item: T, index: number, items: T[]): boolean =>
    items.findIndex((current) => predicate(item, current)) === index;

export const orderBy =
  <T>(predicate: (item: T) => any = identity) =>
  (a: T, b: T): number => {
    const orderA = predicate(a);
    const orderB = predicate(b);
    return orderA === orderB ? 0 : orderA > orderB ? 1 : -1;
  };

export const isNil = <T>(item: T | undefined | null): item is T => Boolean(item);

export const isDiffBy =
  <T>(predicate: (item: T) => unknown, to: T[]) =>
  (fromItem: T): boolean =>
    !to.some((toItem) => predicate(fromItem) === predicate(toItem));

export const groupBy = <T, K extends string | number>(predicate: (item: T) => K, items: T[]): Record<K, T[]> =>
  items.reduce((acc, item) => {
    const key = predicate(item);
    return { ...acc, [key]: (acc[key] ?? ([] as T[])).concat(item) };
  }, {} as Record<K, T[]>);

export const chunk = <T>(size: number, items: T[]): T[][] =>
  [...Array(Math.ceil(items.length / size))].map((_, index) => items.slice(index * size, (index + 1) * size));

export const isObject = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null;

export const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined) {
    return false;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    if (a === null || b === null) {
      return false;
    } else if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    } else if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((item, index) => isEqual(item, b[index]));
    } else if (isObject(a) && isObject(b)) {
      const aKeys = Object.keys(a).sort();
      const bKeys = Object.keys(a).sort();
      return isEqual(aKeys, bKeys) && aKeys.every((key) => isEqual(a[key], b[key]));
    }
  }
  return false;
};
