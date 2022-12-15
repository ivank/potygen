import { Client } from 'pg';
import { testDb } from './helpers';
import { toReadable } from '../src';
import { sql } from '@potygen/potygen';
import { pipeline, Writable } from 'stream';
import { promisify } from 'util';

let db: Client;

interface Query {
  params: {};
  result: { id: number }[];
}

const allSql = sql<Query>`SELECT id FROM all_types`;
const asyncPipeline = promisify(pipeline);

describe('Template Tag', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it('Should stream a readable', async () => {
    const readable = toReadable(allSql, { batchSize: 1 });
    const source = readable(db, {});
    const items: { id: number }[] = [];
    const sink = new Writable({
      objectMode: true,
      write: (chunk, encoding, callback) => {
        items.push(chunk);
        callback();
      },
    });

    await asyncPipeline(source, sink);

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should stream a readable with a bigger batch', async () => {
    const readable = toReadable(allSql);
    const source = readable(db, {});
    const items: { id: number }[] = [];
    const sink = new Writable({
      objectMode: true,
      write: (chunk, encoding, callback) => {
        items.push(chunk);
        callback();
      },
    });

    await asyncPipeline(source, sink);

    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should stream a readable inBatches', async () => {
    const readable = toReadable(allSql, { batchSize: 1, inBatches: true });
    const source = readable(db, {});
    const items: { id: number }[][] = [];
    const sink = new Writable({
      objectMode: true,
      write: (chunk, encoding, callback) => {
        items.push(chunk);
        callback();
      },
    });

    await asyncPipeline(source, sink);

    expect(items).toEqual([[{ id: 1 }], [{ id: 2 }]]);
  });
});
