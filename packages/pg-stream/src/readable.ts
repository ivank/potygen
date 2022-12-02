import { SqlInterface, Query, toQueryConfigFromSource } from '@potygen/potygen';
import { ClientBase } from 'pg';
import { Readable } from 'stream';
import { toInternalCursorGenerator } from './internal-cursor-generator';

export interface ToReadableOptions {
  batchSize?: number;
  highWaterMark?: number;
  inBatches?: boolean;
}

export type ToReadable<TSqlInterface extends SqlInterface = SqlInterface> = (
  db: ClientBase,
  params: TSqlInterface['params'],
) => Readable;

export const toReadable = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  { batchSize = 1000, highWaterMark, inBatches }: ToReadableOptions = {},
): ToReadable<TSqlInterface> => {
  const source = query();
  return (db, params) => {
    const queryConfig = toQueryConfigFromSource(source, params);
    async function read(this: Readable) {
      try {
        for await (const batch of toInternalCursorGenerator<TSqlInterface>(db, queryConfig, batchSize)) {
          if (inBatches) {
            this.push(batch);
          } else {
            for (const item of batch) {
              this.push(item);
            }
          }
        }
        this.push(null);
      } catch (error) {
        this.destroy(error as Error);
      }
    }
    return new Readable({ objectMode: true, highWaterMark, read });
  };
};
