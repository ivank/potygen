import { parser } from '@ovotech/potygen-ast';
import { toQueryInterface } from '@ovotech/potygen-query';
import { Client } from 'pg';
import { loadQueryInterfacesData, toLoadedQueryInterface } from '../src/load';
import { sqlFiles, withParserErrors } from './helpers';

let db: Client;

describe('Load Files', () => {
  beforeAll(async () => {
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(() => db.end());

  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(async () => {
      const ast = parser(sql);
      const queryInterface = toQueryInterface(ast!);
      const data = await loadQueryInterfacesData(db, [queryInterface], []);
      expect(toLoadedQueryInterface(data)(queryInterface)).toMatchSnapshot(name);
    }),
  );
});
