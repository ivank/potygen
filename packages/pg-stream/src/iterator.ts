import { SqlInterface, Query, toQueryConfigFromSource } from '@potygen/potygen';
import { ClientBase } from 'pg';
import { toInternalCursorGenerator } from './internal-cursor-generator';

export interface ToIteratorOptions {
  batchSize?: number;
}

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never;

export type ToAsyncIterator<TSqlInterface extends SqlInterface<unknown[]> = SqlInterface<unknown[]>> = (
  db: ClientBase,
  params: TSqlInterface['params'],
) => AsyncGenerator<ArrayElement<TSqlInterface['result']>>;

export const toAsyncIterator = <
  TSqlInterface extends SqlInterface<unknown[]> = SqlInterface<unknown[]>,
  TOriginalResult = TSqlInterface['result'],
>(
  query: Query<TSqlInterface, TOriginalResult>,
  { batchSize = 1000 }: ToIteratorOptions = {},
): ToAsyncIterator<TSqlInterface> => {
  const source = query();
  return async function* (db, params) {
    const queryConfig = toQueryConfigFromSource(source, params);
    for await (const batch of toInternalCursorGenerator(db, queryConfig, batchSize, params, source.mapper)) {
      for (const item of batch) {
        yield item as ArrayElement<TSqlInterface['result']>;
      }
    }
  };
};

export type ToAsyncBatchIterator<TSqlInterface extends SqlInterface<unknown[]> = SqlInterface<unknown[]>> = (
  db: ClientBase,
  params: TSqlInterface['params'],
) => AsyncGenerator<TSqlInterface['result']>;

export const toAsyncBatchIterator = <TSqlInterface extends SqlInterface<unknown[]> = SqlInterface<unknown[]>>(
  query: Query<TSqlInterface>,
  { batchSize = 1000 }: ToIteratorOptions = {},
): ToAsyncBatchIterator<TSqlInterface> => {
  const source = query();
  return async function* (db, params) {
    const queryConfig = toQueryConfigFromSource(source, params);
    for await (const batch of toInternalCursorGenerator(db, queryConfig, batchSize, params, source.mapper)) {
      yield batch;
    }
  };
};
