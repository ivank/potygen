import { parser } from '@potygen/ast';
import { Client } from 'pg';
import { loadQueryInterfacesData, toLoadedQueryInterface } from '../src/load';
import { toQueryInterface } from '@potygen/query';
import { LoadedData } from '../src';

let db: Client;

describe('Query Interface', () => {
  beforeAll(async () => {
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
  });

  it.each<[string, string]>([
    ['function result single', `SELECT ABS(integer_col) FROM all_types`],
    ['function result double', `SELECT ABS(ABS(integer_col)) FROM all_types`],
    ['nested function guess type', `SELECT ABS(ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)) FROM all_types GROUP BY id`],
    [
      'nested function explicit type',
      `SELECT ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)::int[] FROM all_types GROUP BY id`,
    ],
    ['operators integer', `SELECT integer_col + integer_col AS "test1" FROM all_types WHERE id = $id`],
    ['operators string', `SELECT character_col + integer_col AS "test1" FROM all_types WHERE character_col = $text`],
    ['different result types', `SELECT * FROM all_types`],
    ['enum', `SELECT 'Pending'::account_levelisation_state`],
    ['enum column', `SELECT state FROM account_levelisations`],
    ['simple', `SELECT id, character_col FROM all_types WHERE id = :id`],
    ['coalesce 1', `SELECT COALESCE(id, character_col) FROM all_types`],
    ['coalesce 2', `SELECT COALESCE(character_col, id) FROM all_types`],
    ['coalesce 3', `SELECT COALESCE(12, character_col, id) FROM all_types`],
    ['coalesce 4', `SELECT COALESCE(integer_col, character_col) FROM all_types`],
    ['parameter coalesce', `SELECT character_col FROM all_types WHERE integer_col > COALESCE($id, 2)`],
  ])('Should convert %s sql (%s)', async (_, sql) => {
    const ast = parser(sql);
    const queryInterface = toQueryInterface(ast!);
    const data = await loadQueryInterfacesData(db, [queryInterface], []);
    const loadedQueryInterface = toLoadedQueryInterface(data)(queryInterface);

    expect(loadedQueryInterface).toMatchSnapshot();
  });

  it('Should load multple queries', async () => {
    const queryInterfaces = [
      `SELECT ABS(integer_col) FROM all_types`,
      `SELECT ABS(ABS(integer_col)) FROM all_types`,
      `SELECT ABS(ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)) FROM all_types GROUP BY id`,
      `SELECT ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)::int[] FROM all_types GROUP BY id`,
      `SELECT integer_col + integer_col AS "test1" FROM all_types WHERE id = $id`,
      `SELECT character_col + integer_col AS "test1" FROM all_types WHERE character_col = $text`,
      `SELECT * FROM all_types`,
      `SELECT 'Pending'::account_levelisation_state`,
      `SELECT state FROM account_levelisations`,
      `SELECT id, character_col FROM all_types WHERE id = :id`,
    ].map((sql) => {
      const ast = parser(sql);
      return toQueryInterface(ast!);
    });

    const data = await loadQueryInterfacesData(db, queryInterfaces, []);

    let individuallyLoaded: LoadedData[] = [];
    for (const query of queryInterfaces) {
      individuallyLoaded = await loadQueryInterfacesData(db, [query], individuallyLoaded);
    }

    expect(data).toEqual(expect.arrayContaining(individuallyLoaded));
  });
});
