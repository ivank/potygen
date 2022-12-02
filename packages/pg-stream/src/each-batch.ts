import { SqlInterface, Query, toQueryConfigFromSource } from '@potygen/potygen';
import { ClientBase } from 'pg';
import { toInternalCursorGenerator } from './internal-cursor-generator';

export interface ToEachBatchOptions {
  batchSize?: number;
}

export type ToEachBatch<TSqlInterface extends SqlInterface = SqlInterface> = (
  db: ClientBase,
  params: TSqlInterface['params'],
  eachBatch: (items: TSqlInterface['result'][]) => Promise<void>,
) => Promise<void>;

export const toEachBatch = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  { batchSize = 1000 }: ToEachBatchOptions = {},
): ToEachBatch<TSqlInterface> => {
  const source = query();
  return async (db, params, eachBatch) => {
    const queryConfig = toQueryConfigFromSource(source, params);
    for await (const batch of toInternalCursorGenerator(db, queryConfig, batchSize)) {
      await eachBatch(batch);
    }
  };
};
