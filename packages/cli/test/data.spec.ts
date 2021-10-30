import { Client } from 'pg';
import { sql } from '@psql-ts/query';
import { EndQuery, InitQuery, RetrieveQuery, StartQuery } from './data.spec.queries';

describe('Data', () => {
  it('Should return data correctly', async () => {
    const db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });

    const start = sql<StartQuery>`BEGIN`;
    const init = sql<InitQuery>`INSERT INTO all_types (id,not_null) VALUES (1,1),(2,2)`;
    const retrieve = sql<RetrieveQuery>`SELECT * FROM all_types`;
    const end = sql<EndQuery>`ROLLBACK`;

    try {
      await db.connect();

      await start.run(db);
      await init.run(db);
      const data = await retrieve.run(db);
      expect(data).toHaveLength(2);
      expect(data[0].id).toEqual(1);
      expect(data[0].character_col).toBe(undefined);
    } finally {
      await end.run(db);
      await db.end();
    }
  });
});
