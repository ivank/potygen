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
export interface SqlInterface {
  params: object;
  result: unknown;
}

/**
 * External database instance. Like [pg package](https://node-postgres.com)'s [Client](https://node-postgres.com/api/client) or [Pool](https://node-postgres.com/api/pool)
 */
export interface SqlDatabase {
  query: <T extends Record<string, unknown>>(value: QueryConfig) => Promise<SqlResult<T>>;
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
export interface QuerySource {
  sql: string;
  ast: AstTag;
  params: Param[];
}

/**
 * SQL Query call.
 */
export type Query<TSqlInterface extends SqlInterface = SqlInterface> = {
  (db: SqlDatabase, params: TSqlInterface['params']): Promise<TSqlInterface['result'][]>;
  (): QuerySource;
};

/**
 * SQL Query call, which result is then mapped to a different result type
 */
export type MapQuery<TSqlInterface extends SqlInterface = SqlInterface, TResult = unknown> = {
  (db: SqlDatabase, params: TSqlInterface['params']): Promise<TResult>;
  (): QuerySource;
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
