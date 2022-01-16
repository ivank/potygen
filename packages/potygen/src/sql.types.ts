export interface SqlInterface {
  params: unknown;
  result: unknown;
}

export interface SqlQuery {
  text: string;
  values?: unknown[];
}

export interface SqlResult<T extends Record<string, unknown>> {
  rows: T[];
}

export interface SqlDatabase {
  query: <T extends Record<string, unknown>>(value: SqlQuery) => Promise<SqlResult<T>>;
}

/**
 * Deeply convert one typescript type to another, following nested objects and arrays
 *
 * ```typescript
 * interface MyType {
 *   date: Date;
 * }
 *
 * type JsonMyTpe = Json<MyType>
 *
 * // JsonMyTpe['date'] will be string
 * ```
 */
export type Json<T> = T extends Date
  ? string
  : T extends string | number | boolean | null | undefined
  ? T
  : T extends Buffer
  ? { type: 'Buffer'; data: number[] }
  : {
      [K in keyof T]: T[K] extends (infer U)[] ? Json<U>[] : Json<T[K]>;
    };
