export interface SqlInterface {
  params: unknown;
  result: unknown;
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
