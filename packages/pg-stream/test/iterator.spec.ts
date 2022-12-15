import { Client } from 'pg';
import { testDb } from './helpers';
import { toAsyncBatchIterator, toAsyncIterator } from '../src';
import { sql } from '@potygen/potygen';

let db: Client;

interface Query {
  params: {};
  result: { id: number }[];
}

const allSql = sql<Query>`SELECT id FROM all_types`;

describe('Template Tag', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it('Should iterate over a query in items', async () => {
    const iterator = toAsyncIterator(allSql, { batchSize: 1 });
    const items: { id: number }[] = [];

    for await (const item of iterator(db, {})) {
      items.push(item);
    }

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should iterate over a query in items one by one', async () => {
    const iterator = toAsyncIterator(allSql, { batchSize: 2 });
    const items: { id: number }[] = [];

    for await (const item of iterator(db, {})) {
      items.push(item);
    }

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should iterate over a query batch', async () => {
    const iterator = toAsyncBatchIterator(allSql, { batchSize: 1 });
    const items: { id: number }[][] = [];

    for await (const batch of iterator(db, {})) {
      items.push(batch);
    }

    expect(items).toEqual([[{ id: 1 }], [{ id: 2 }]]);
  });

  it('Should iterate over a query batch with more items', async () => {
    const iterator = toAsyncBatchIterator(allSql, { batchSize: 2 });
    const items: { id: number }[][] = [];

    for await (const batch of iterator(db, {})) {
      items.push(batch);
    }

    expect(items).toEqual([[{ id: 1 }, { id: 2 }]]);
  });
});
