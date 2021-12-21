import { Client } from 'pg';
import { maybeOne, one, sql } from '../src';
import { testDb } from './helpers';

let db: Client;

const allSql = sql`SELECT id FROM all_types`;
const oneSql = sql`SELECT id FROM all_types WHERE id = $id`;

describe('Template Tag', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it('Should select all', async () => {
    expect(await allSql.run(db)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('Should select with params', async () => {
    expect(await oneSql.run(db, { id: 2 })).toEqual([{ id: 2 }]);
  });

  it('Should select maybe one', async () => {
    expect(await maybeOne(oneSql).run(db, { id: 1 })).toEqual({ id: 1 });
  });

  it('Should select maybe one empty', async () => {
    expect(await maybeOne(oneSql).run(db, { id: 1000 })).toEqual(undefined);
  });

  it('Should select only one', async () => {
    expect(await one(oneSql).run(db, { id: 1 })).toEqual({ id: 1 });
  });

  it('Should select error if one empty', async () => {
    await expect(async () => {
      await one(oneSql).run(db, { id: 1000 });
    }).rejects.toMatchObject({ message: 'Must return at least one' });
  });
});
