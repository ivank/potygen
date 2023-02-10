/**
 * util.ts
 *
 * A minimalist implementation of [lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide)
 */

/**
 * This method returns the first argument it receives.
 */
export const identity = <T>(item: T): T => item;

/**
 * Checks if value is an empty array.
 */
export const isEmpty = <T>(items?: T[]): boolean => !items || items?.length === 0;

export function tail<T>(items: [unknown, ...T[]]): T[];
export function tail<T>(items: T[]): T[];
/**
 * Gets all but the first element of array.
 */
export function tail<T>(items: T[]): T[] {
  return items.slice(1);
}

export function last<T>(items?: [...unknown[], T]): T;
export function last<T>(items?: T[]): T | undefined;
/**
 * Gets the last element of array.
 */
export function last<T>(items?: T[]): T | undefined {
  return items?.[items.length - 1];
}

export function first<T>(items?: [T, ...unknown[]]): T;
export function first<T>(items?: T[]): T | undefined;
/**
 * Gets the first element of array.
 */
export function first<T>(items?: T[]): T | undefined {
  return items?.[0];
}

export function initial<T>(items: [...T[], unknown]): T[];
export function initial<T>(items: T[]): T[];
/**
 * Gets all but the last element of array.
 */
export function initial<T>(items: T[]): T[] {
  return items.slice(0, -1);
}

/**
 * Creates an array of numbers (positive and/or negative) progressing from start up to, but not including, end.
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => i + start);
}

/**
 * Filter out items that are not unique based on a predicate.
 *
 * ```typescript
 * myArray.filter(isUnique((item) => item.id));
 * ```
 */
export const isUnique =
  <T>(predicate: (item: T) => unknown = identity) =>
  (item: T, index: number, items: T[]): boolean =>
    items.findIndex((current) => predicate(item) === predicate(current)) === index;

/**
 * Filter out items that are not unique based on a predicate that compares two items.
 *
 * ```typescript
 * myArray.filter(isUniqueBy((a, b) => a.id === b.id));
 * ```
 */
export const isUniqueBy =
  <T>(predicate: (a: T, b: T) => boolean = isEqual) =>
  (item: T, index: number, items: T[]): boolean =>
    items.findIndex((current) => predicate(item, current)) === index;

/**
 * Order items by a predicate, ascending order
 *
 * ```typescript
 * myArray.sort(orderBy(item) => a.position));
 * ```
 */
export const orderBy =
  <T>(predicate: (item: T) => any = identity) =>
  (a: T, b: T): number => {
    const orderA = predicate(a);
    const orderB = predicate(b);
    return orderA === orderB ? 0 : orderA > orderB ? 1 : -1;
  };

/**
 * Filter out falsy values from an array
 *
 * ```typescript
 * myArray.filter(isNil);
 * ```
 */
export const isNil = <T>(item: T | undefined | null): item is T => Boolean(item);

export const isDiffBy =
  <T>(predicate: (item: T) => unknown, to: T[]) =>
  (fromItem: T): boolean =>
    !to.some((toItem) => predicate(fromItem) === predicate(toItem));

/**
 * Creates an object composed of keys generated from the results of running each element of collection thru iteratee.
 * The order of grouped values is determined by the order they occur in collection.
 * The corresponding value of each key is an array of elements responsible for generating the key. The iteratee is invoked with one argument: (value).
 */
export const groupBy = <T, K extends string | number>(predicate: (item: T) => K, items: T[]): Record<K, T[]> =>
  items.reduce((acc, item) => {
    const key = predicate(item);
    return { ...acc, [key]: (acc[key] ?? ([] as T[])).concat(item) };
  }, {} as Record<K, T[]>);

/**
 * Creates an array of elements split into groups the length of size. If array can't be split evenly, the final chunk will be the remaining elements.
 */
export const chunk = <T>(size: number, items: T[]): T[][] =>
  [...Array(Math.ceil(items.length / size))].map((_, index) => items.slice(index * size, (index + 1) * size));

/**
 * Checks if value is the language type of Object. (e.g. arrays, functions, objects, new RegExp(''), new Number(0), and new String(''))
 */
export const isObject = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null;

/**
 * Convert to milliseconds the response from process.hrtime
 */
export const toMilliseconds = (time: [number, number]) => time[0] * 1e3 + time[1] * 1e-6;

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 */
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

/**
 * Reverse of findIndex
 */
export const findLastIndex = <T>(predicate: (value: T) => boolean, array: T[]): number => {
  let index = array.length;
  while (index--) {
    if (predicate(array[index])) {
      return index;
    }
  }
  return -1;
};
