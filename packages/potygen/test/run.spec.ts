import { Client } from 'pg';
import * as pgp from 'pg-promise';
import { maybeOneResult, oneResult, sql, mapResult } from '../src';
import { testDb, connectionString } from './helpers';

let db: Client;

interface Query {
  params: {};
  result: { id: number };
}

const allSql = sql<Query>`SELECT id FROM all_types`;
const oneSql = sql<Query>`SELECT id FROM all_types WHERE id = $id`;
const otherSql = sql<Query>`SELECT 'TEST' || "not_null" AS t FROM all_types WHERE id = $id`;

describe('Template Tag', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it('Should use parameter with spread without pick', async () => {
    const query = sql`SELECT "not_null" FROM all_types WHERE id IN $$ids`;
    expect(await query(db, { ids: [1, 2] })).toEqual([{ not_null: 1 }, { not_null: 2 }]);
  });

  it('Should insert inside transaction with spread pick', async () => {
    await sql`BEGIN`(db, {});

    await sql`
      INSERT INTO all_types (
        not_null,
        jsonb_col
      )
      VALUES
        $$items(
          val,
          data
        )
      `(db, {
      items: [
        { val: 10, data: JSON.stringify({ test: 10 }) },
        { val: 20, data: JSON.stringify({ test: 20 }) },
      ],
    });
    const data = await sql`SELECT jsonb_col FROM all_types WHERE "not_null" IN $$notNull`(db, { notNull: [10, 20] });
    await sql`ROLLBACK`(db, {});

    expect(data).toEqual([{ jsonb_col: { test: 10 } }, { jsonb_col: { test: 20 } }]);
  });

  it('Should select all', async () => {
    expect(await allSql(db, {})).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should select all using pgp', async () => {
    const db = pgp()(connectionString);

    expect(await allSql(db, {})).toEqual([{ id: 1 }, { id: 2 }]);

    await db.$pool.end();
  });

  it('Should select with params', async () => {
    expect(await oneSql(db, { id: 2 })).toEqual([{ id: 2 }]);
  });

  it('Should select maybe one', async () => {
    expect(await maybeOneResult(oneSql)(db, { id: 1 })).toEqual({ id: 1 });
  });

  it('Should select maybe one empty', async () => {
    expect(await maybeOneResult(oneSql)(db, { id: 1000 })).toEqual(undefined);
  });

  it('Should select only one', async () => {
    expect(await oneResult(oneSql)(db, { id: 1 })).toEqual({ id: 1 });
  });

  it('Should select map', async () => {
    expect(await mapResult((rows) => rows.map((item) => `!${item.id}`), allSql)(db, {})).toEqual(['!1', '!2']);
  });

  it('Should select more', async () => {
    expect(
      await mapResult(async (rows, db) => await Promise.all(rows.map((item) => otherSql(db, { id: item.id }))), allSql)(
        db,
        {},
      ),
    ).toEqual([[{ t: 'TEST1' }], [{ t: 'TEST2' }]]);
  });

  it('Should select error if one empty', async () => {
    await expect(async () => {
      await oneResult(oneSql)(db, { id: 1000 });
    }).rejects.toMatchObject({ message: 'Must return at least one' });
  });
});
