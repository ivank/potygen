import { Parser } from '@ikerin/rd-parse';
import { Client } from 'pg';
import { loadTypes } from '../src/load-types';
import { convertSelect } from '../src/query-interface';
import { SqlGrammar } from '../src/sql.grammar';

const parser = Parser(SqlGrammar);
let db: Client;

describe('Query Interface', () => {
  beforeAll(async () => {
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
  });

  it.each<[string, string]>([['simple', `SELECT id, name FROM table1 WHERE id = :id`]])(
    'Should convert %s sql (%s)',
    async (_, sql) => {
      const ast = parser(sql);
      const queryInterface = convertSelect(ast);
      const loadedQueryInterface = await loadTypes(db, queryInterface);
      expect(loadedQueryInterface).toMatchSnapshot();
    },
  );
});
