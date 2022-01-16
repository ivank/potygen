import { sql } from '../src';
import { EndQuery, InitQuery, RetrieveQuery, StartQuery } from './data.spec.queries';
import { testDb } from './helpers';

describe('Data', () => {
  it('Should return data correctly', async () => {
    const db = testDb();

    const start = sql<StartQuery>`BEGIN`;
    const init = sql<InitQuery>`INSERT INTO all_types (id,not_null) VALUES (10,10),(11,11)`;
    const retrieve = sql<RetrieveQuery>`SELECT * FROM all_types WHERE id >= 10`;
    const end = sql<EndQuery>`ROLLBACK`;

    try {
      await db.connect();

      await start.run(db);
      await init.run(db);
      const data = await retrieve.run(db);
      expect(data).toHaveLength(2);
      expect(data[0].id).toEqual(10);
      expect(data[0].character_col).toBe(undefined);
    } finally {
      await end.run(db);
      await db.end();
    }
  });
});
