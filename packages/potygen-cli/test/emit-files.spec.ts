import { parser } from '@potygen/ast';
import { toQueryInterface } from '@potygen/query';
import { Client } from 'pg';
import { createPrinter, NewLineKind } from 'typescript';
import { toTypeSource } from '../src';
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

  it.each(sqlFiles())('Should convert complex sql %s', (path, content) =>
    withParserErrors(async () => {
      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const printer = createPrinter({ newLine: NewLineKind.LineFeed });
      const ast = parser(content);
      const queryInterface = toQueryInterface(ast);

      const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
      const loadedQuery = toLoadedQueryInterface(data)(queryInterface);
      const source = toTypeSource({ type: 'sql', path: path, content, queryInterface, loadedQuery });
      expect(printer.printFile(source)).toMatchSnapshot(path);
    }),
  );
});
