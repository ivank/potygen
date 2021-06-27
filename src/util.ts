export const tail = <T>(items: T[]): T[] => items.slice(1);
export const isEmpty = <T>(items?: T[]): items is T[] => !items || items?.length === 0;
export const last = <T>(items?: T[]): T | undefined => items?.[items.length - 1];
export const first = <T>(items?: T[]): T | undefined => items?.[0];
export const initial = <T>(items: T[]): T[] => items?.slice(0, -1);
