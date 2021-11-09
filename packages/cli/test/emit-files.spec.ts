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
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(() => db.end());

  it.each(sqlFiles())('Should convert complex sql %s', (path, content) =>
    withParserErrors(async () => {
      const printer = createPrinter({ newLine: NewLineKind.LineFeed });
      const ast = parser(content);
      const queryInterface = toQueryInterface(ast!);

      const data = await loadQueryInterfacesData(db, [queryInterface], []);
      const loadedQuery = toLoadedQueryInterface(data)(queryInterface);
      const source = toTypeSource({ type: 'sql', path: path, content, queryInterface, loadedQuery });
      expect(printer.printFile(source)).toMatchSnapshot(path);
    }),
  );
});
