import { SqlInterface, Query, toQueryConfigFromSource } from '@potygen/potygen';
import { ClientBase } from 'pg';
import { toInternalCursorGenerator } from './internal-cursor-generator';

export interface ToIteratorOptions {
  batchSize?: number;
}

export type ToAsyncIterator<TSqlInterface extends SqlInterface = SqlInterface> = (
  db: ClientBase,
  params: TSqlInterface['params'],
) => AsyncGenerator<TSqlInterface['result']>;

export const toAsyncIterator = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  { batchSize = 1000 }: ToIteratorOptions = {},
): ToAsyncIterator<TSqlInterface> => {
  const source = query();
  return async function* (db, params) {
    const queryConfig = toQueryConfigFromSource(source, params);
    for await (const batch of toInternalCursorGenerator(db, queryConfig, batchSize)) {
      for (const item of batch) {
        yield item;
      }
    }
  };
};

export type ToAsyncBatchIterator<TSqlInterface extends SqlInterface = SqlInterface> = (
  db: ClientBase,
  params: TSqlInterface['params'],
) => AsyncGenerator<TSqlInterface['result'][]>;

export const toAsyncBatchIterator = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  { batchSize = 1000 }: ToIteratorOptions = {},
): ToAsyncBatchIterator<TSqlInterface> => {
  const source = query();
  return async function* (db, params) {
    const queryConfig = toQueryConfigFromSource(source, params);
    for await (const batch of toInternalCursorGenerator(db, queryConfig, batchSize)) {
      yield batch;
    }
  };
};
