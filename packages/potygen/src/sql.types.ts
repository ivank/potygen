import { AstTag } from './grammar.types';
import { Param } from './query-interface.types';

export interface SqlInterface {
  params: object;
  result: unknown;
}

export interface QueryConfig {
  text: string;
  values?: unknown[];
}

export interface QuerySource {
  sql: string;
  ast: AstTag;
  params: Param[];
}

export interface SqlResult<T extends Record<string, unknown>> {
  rows: T[];
}

export interface SqlDatabase {
  query: <T extends Record<string, unknown>>(value: QueryConfig) => Promise<SqlResult<T>>;
}

export type Query<TSqlInterface extends SqlInterface = SqlInterface> = {
  (db: SqlDatabase, params: TSqlInterface['params']): Promise<TSqlInterface['result'][]>;
  (): QuerySource;
};

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
