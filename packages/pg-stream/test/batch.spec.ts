import { Client } from 'pg';
import { testDb } from './helpers';
import { toEachBatch } from '../src';
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

  it('Should iterate in batches', async () => {
    const eachBatch = toEachBatch(allSql, { batchSize: 1 });
    const items: { id: number }[][] = [];
    await eachBatch(db, {}, async (batch) => {
      items.push(batch);
    });

    expect(items).toEqual([[{ id: 1 }], [{ id: 2 }]]);
  });

  it('Should retrieve big batch', async () => {
    const eachBatch = toEachBatch(allSql);
    const items: { id: number }[][] = [];
    await eachBatch(db, {}, async (batch) => {
      items.push(batch);
    });

    expect(items).toEqual([[{ id: 1 }, { id: 2 }]]);
  });
});
