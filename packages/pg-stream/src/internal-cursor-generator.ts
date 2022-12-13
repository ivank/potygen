import {
  SqlInterface,
  isDatabaseError,
  PotygenDatabaseError,
  nullToUndefinedInPlace,
  QueryConfig,
} from '@potygen/potygen';
import { ClientBase } from 'pg';
import Cursor from 'pg-cursor';

export async function* toInternalCursorGenerator<
  TSqlInterface extends SqlInterface<unknown[]> = SqlInterface<unknown[]>,
>(
  db: ClientBase,
  queryConfig: QueryConfig,
  batchSize: number,
  params: TSqlInterface['params'],
  mapper: (items: unknown, db: ClientBase, params: SqlInterface['params']) => TSqlInterface['result'],
): AsyncGenerator<TSqlInterface['result']> {
  const cursor = new Cursor(queryConfig.text, queryConfig.values);
  try {
    db.query(cursor);
    do {
      const items = await cursor.read(batchSize);
      if (items.length) {
        yield mapper(items.map(nullToUndefinedInPlace), db, params);
      } else {
        break;
      }
    } while (true);
    await cursor.close();
  } catch (error) {
    await cursor.close();
    throw error instanceof Error && isDatabaseError(error) ? new PotygenDatabaseError(error, queryConfig) : error;
  }
}
