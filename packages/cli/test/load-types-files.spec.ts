import { parser } from '@psql-ts/ast';
import { toQueryInterface } from '@psql-ts/query';
import { Client } from 'pg';
import { loadQuery } from '../src/load-types';
import { sqlFiles, withParserErrors } from './helpers';

let db: Client;

describe('Load Files', () => {
  beforeAll(async () => {
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
  });

  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(async () => {
      const ast = parser(sql);
      const query = toQueryInterface(ast!);
      const loadedQuery = await loadQuery(db, query);
      expect(loadedQuery.query).toMatchSnapshot(name);
    }),
  );
});
