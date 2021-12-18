import { Client } from 'pg';
import { toQueryInterface } from '@potygen/query';
import { parser } from '@potygen/ast';
import { createPrinter, NewLineKind } from 'typescript';
import { toTypeSource } from '../src/emit';
import { loadQueryInterfacesData, toLoadedQueryInterface } from '../src/load';

let db: Client;

describe('Query Interface', () => {
  beforeAll(async () => {
    db = new Client({
      connectionString: process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen',
    });
    await db.connect();
  });

  afterAll(() => db.end());

  it.each<[string, string]>([
    ['function result single', `SELECT ABS(integer_col) FROM all_types`],
    ['function result double', `SELECT ABS(ABS(integer_col)) FROM all_types`],
    ['nested function guess type', `SELECT ABS(ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)) FROM all_types GROUP BY id`],
    ['nested function explicit type', `SELECT (ARRAY_AGG(integer_col), 1)::int[] FROM all_types GROUP BY id`],
    ['operators integer', `SELECT integer_col + integer_col AS "test1" FROM all_types WHERE id = $id`],
    ['operators string', `SELECT character_col + integer_col AS "test1" FROM all_types WHERE character_col = $text`],
    ['different result types', `SELECT * FROM all_types`],
    ['enum', `SELECT 'Pending'::account_levelisation_state`],
    ['enum column', `SELECT state FROM account_levelisations`],
    ['simple', `SELECT id, character_col FROM all_types WHERE id = :id`],
    [
      'insert',
      `INSERT INTO all_types(not_null, integer_col, character_col) VALUES $$vals(notNull, integerCol, characterCol)`,
    ],
  ])('Should convert %s sql (%s)', async (path, content) => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const printer = createPrinter({ newLine: NewLineKind.LineFeed });
    const ast = parser(content);
    const queryInterface = toQueryInterface(ast);

    const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
    const loadedQuery = toLoadedQueryInterface(data)(queryInterface);
    const source = toTypeSource({ type: 'sql', path, content, queryInterface, loadedQuery });
    expect(printer.printFile(source)).toMatchSnapshot();
  });
});
