/**
 * sql.types.ts
 *
 * The actual implementation is in [sql.ts](./sql.ts)
 */

import { AstTag } from './grammar.types';
import { Param } from './query-interface.types';

/**
 * Inputs and outputs of an sql query ({@link sql})
 */
export interface SqlInterface<TResult = unknown> {
  params: object;
  result: TResult;
}

/**
 * External database instance. Like [pg package](https://node-postgres.com)'s [Client](https://node-postgres.com/apis/client) or [Pool](https://node-postgres.com/apis/pool)
 */
export interface SqlDatabase {
  query: <T extends Record<string, unknown>>(value: QueryConfig) => Promise<SqlResult<T> | T[]>;
}

/**
 * The query that's sent to the {@link SqlDatabase} query call
 */
export interface QueryConfig {
  text: string;
  values?: unknown[];
}

/**
 * The result of {@link SqlDatabase} query call
 */
export interface SqlResult<T extends Record<string, unknown>> {
  rows: T[];
}

/**
 * Intermediate sql query conversion, where the query is parsed (with {@link parser})
 */
export interface QuerySource<
  TSqlInterface extends SqlInterface = SqlInterface,
  TOriginalResult = TSqlInterface['result'],
> {
  sql: string;
  ast: AstTag;
  params: Param[];
  mapper: (rows: TOriginalResult, db: SqlDatabase, params: TSqlInterface['params']) => TSqlInterface['result'];
}

/**
 * SQL Query call.
 */
export type Query<TSqlInterface extends SqlInterface = SqlInterface, TOriginalResult = TSqlInterface['result']> = {
  (db: SqlDatabase, params: TSqlInterface['params']): Promise<TSqlInterface['result']>;
  (): QuerySource<TSqlInterface, TOriginalResult>;
};

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

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;
