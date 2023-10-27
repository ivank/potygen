import { Client } from 'pg';
import { parser, toQueryInterface, loadQueryInterfacesData, toLoadedQueryInterface } from '../src';
import { sqlFiles, testDb, withParserErrors } from './helpers';

let db: Client;

describe('Load Files', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  }, 30000);

  afterAll(() => db.end(), 10000);

  it.each(sqlFiles())(
    'Should convert complex sql %s',
    (name, sql) =>
      withParserErrors(async () => {
        const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
        const queryInterface = toQueryInterface(parser(sql).ast);
        const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
        expect(toLoadedQueryInterface(data)(queryInterface)).toMatchSnapshot(name);
      }),
    30000,
  );
});
