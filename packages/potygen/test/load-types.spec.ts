import {
  parser,
  toQueryInterface,
  LoadedData,
  loadQueryInterfacesData,
  toLoadedQueryInterface,
  loadAllData,
} from '../src';
import { testDb } from './helpers';

let data: LoadedData[] = [];

describe('Query Interface', () => {
  beforeAll(async () => {
    const db = testDb();
    await db.connect();
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    data = await loadAllData({ db, logger }, []);
    await db.end();
  });

  it.each<[string, string]>([
    ['select where', `SELECT character_col FROM all_types WHERE integer_col > COALESCE($id, 2)`],
    ['function result single', `SELECT ABS(integer_col) FROM all_types`],
    ['count distinct', `SELECT COUNT(DISTINCT id) FROM all_types`],
    ['function result double', `SELECT ABS(ABS(integer_col)) FROM all_types`],
    ['nested function guess type', `SELECT ABS(ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)) FROM all_types GROUP BY id`],
    [
      'nested function explicit type',
      `SELECT ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)::int[] FROM all_types GROUP BY id`,
    ],
    ['operators integer', `SELECT integer_col + integer_col AS "test1" FROM all_types WHERE id = $id`],
    ['operators string', `SELECT character_col + integer_col AS "test1" FROM all_types WHERE character_col = $text`],
    ['different result types', `SELECT * FROM all_types`],
    ['different result types for returning', `UPDATE all_types SET id = 1 RETURNING *`],
    ['views types', `SELECT * FROM all_types_view`],
    ['enum', `SELECT 'Pending'::account_levelisation_state`],
    ['enum column', `SELECT state FROM account_levelisations`],
    ['enum array const', `SELECT ARRAY[]::account_levelisation_state[]`],
    ['static array const', `SELECT '{}'::bigint[]`],
    ['composite array const', `SELECT '{}'::inventory_item[]`],
    ['empty array const', `SELECT ARRAY[]`],
    ['enum array column', `SELECT state_arr FROM all_types`],
    ['enum array insert', `INSERT INTO all_types (not_null, state_arr) VALUES (1, $state) RETURNING state_arr`],
    ['composite array column', `SELECT item_arr FROM all_types`],
    ['static array column', `SELECT static_arr FROM all_types`],
    ['array column item', `SELECT static_arr[1] AS one_item FROM all_types`],
    ['simple', `SELECT id, character_col FROM all_types WHERE id = :id`],
    ['coalesce 1', `SELECT COALESCE(id, character_col) FROM all_types`],
    ['coalesce 2', `SELECT COALESCE(character_col, id) FROM all_types`],
    ['coalesce 3', `SELECT COALESCE(12, character_col, id) FROM all_types`],
    ['coalesce 4', `SELECT COALESCE(integer_col, character_col) FROM all_types`],
    [
      'array constructor',
      `SELECT ARRAY(SELECT json_build_object('test', other.integer_col) FROM all_types AS other WHERE all_types.id = other.id) as "arr" FROM all_types`,
    ],
    ['date column inside json_build_object', `SELECT json_build_object('dateOn', date_col) FROM all_types`],
    [
      'date literal inside json_build_object',
      `SELECT json_build_object('dateOn', '2022-01-01'::date, 'timestamp', '2022-01-01'::timestamp)`,
    ],
    ['composite type from table', `SELECT (item).supplier_id FROM all_types`],
    ['composite type from view', `SELECT (item).supplier_id FROM all_types_view`],
    ['parameter required', `SELECT character_col FROM all_types WHERE integer_col > $id!`],
    ['parameter coalesce', `SELECT character_col FROM all_types WHERE integer_col > COALESCE($id, 2)`],
    ['sum', `SELECT SUM(integer_col) FROM all_types`],
    [
      'Coalesce binary expression',
      `SELECT COALESCE(numeric_col,0) + COALESCE(numeric_col,0) as "totalPaymentWithVat" FROM all_types`,
    ],
    [
      'Aliased CTE select',
      `WITH nums AS (SELECT id, numeric_col AS "num" FROM all_types)
      SELECT all_types.id, n.num FROM all_types JOIN nums AS n ON n.id = all_types.id`,
    ],
    ['Right function', `SELECT RIGHT('123', 2)`],
    ['Sql function', `SELECT calculate_account_balance($accountId!::int, $sentAt!::timestamp)`],
    [
      'Select with function',
      `SELECT transactions.id, calculate_account_balance(transactions.account_id, transactions.sent_at) FROM transactions`,
    ],
    [
      'Select with aggregate functions',
      `SELECT
        ARRAY_AGG(
          jsonb_build_object(
            'id', transactions.id,
            'balance', calculate_account_balance(transactions.account_id, transactions.sent_at)
          )
        )
      FROM transactions`,
    ],
    ['array of records', `SELECT transactions.history FROM transactions`],
    ['array of records index', `SELECT transactions.history[1] FROM transactions`],
    ['array of records index composite column int', `SELECT (transactions.history[1]).user_id FROM transactions`],
    ['array of records index composite column enum', `SELECT (transactions.history[1]).state FROM transactions`],
  ])(
    'Should convert %s sql (%s)',
    async (_, sql) => {
      const queryInterface = toQueryInterface(parser(sql).ast);
      const loadedQueryInterface = toLoadedQueryInterface(data)(queryInterface);
      expect(loadedQueryInterface).toMatchSnapshot();
    },
    25000,
  );
});

describe('Individual Query Interface', () => {
  it('Should load multiple queries', async () => {
    const db = testDb();
    await db.connect();

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
    ].map((sql) => toQueryInterface(parser(sql).ast));
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const data = await loadQueryInterfacesData({ db, logger }, queryInterfaces, []);

    let individuallyLoaded: LoadedData[] = [];
    for (const query of queryInterfaces) {
      individuallyLoaded = await loadQueryInterfacesData({ db, logger }, [query], individuallyLoaded);
    }

    expect(data).toEqual(expect.arrayContaining(individuallyLoaded));
    await db.end();
  }, 25000);
});
