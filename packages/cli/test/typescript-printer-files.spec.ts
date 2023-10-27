import { parser, toQueryInterface, loadQueryInterfacesData, toLoadedQueryInterface } from '@potygen/potygen';
import { join } from 'path';
import { Client } from 'pg';
import { toTypeScriptPrinter } from '../src';
import { sqlFiles, testDb, withParserErrors } from './helpers';

let db: Client;

const typeScriptPrinter = toTypeScriptPrinter(join(__dirname, '../'), 'test/__generated__/{{name}}.queries.ts');

describe('Load Files', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it.each(sqlFiles())(
    'Should convert complex sql %s',
    (path, content) =>
      withParserErrors(async () => {
        const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
        const { ast } = parser(content);
        const queryInterface = toQueryInterface(ast);

        const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
        const loadedQuery = toLoadedQueryInterface(data)(queryInterface);
        const output = await typeScriptPrinter({ type: 'sql', path: path, content, queryInterface, loadedQuery });
        expect(output).toMatchSnapshot(path);
      }),
    30000,
  );
});
