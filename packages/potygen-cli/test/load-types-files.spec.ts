import { parser } from '@potygen/ast';
import { toQueryInterface } from '@potygen/query';
import { Client } from 'pg';
import { loadQueryInterfacesData, toLoadedQueryInterface } from '../src/load';
import { sqlFiles, withParserErrors } from './helpers';

let db: Client;

describe('Load Files', () => {
  beforeAll(async () => {
    db = new Client({
      connectionString: process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen',
    });
    await db.connect();
  });

  afterAll(() => db.end());

  it.each(sqlFiles())('Should convert complex sql %s', (name, sql) =>
    withParserErrors(async () => {
      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const ast = parser(sql);
      const queryInterface = toQueryInterface(ast);
      const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
      expect(toLoadedQueryInterface(data)(queryInterface)).toMatchSnapshot(name);
    }),
  );
});
