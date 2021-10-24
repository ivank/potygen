import { Client } from 'pg';
import { loadQueryInterface } from '../src';
import { toQueryInterface } from '@psql-ts/query';
import { parser } from '@psql-ts/ast';
import { createPrinter, NewLineKind } from 'typescript';
import { toTypeSource } from '../src/emit';

describe('Query Interface', () => {
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
    const db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    const printer = createPrinter({ newLine: NewLineKind.LineFeed });
    const ast = parser(content);
    const queryInterface = toQueryInterface(ast!);
    try {
      await db.connect();
      const { queryInterface: loadedQuery } = await loadQueryInterface(db, queryInterface);
      const source = toTypeSource({ type: 'sql', path, content, queryInterface, loadedQuery });
      expect(printer.printFile(source)).toMatchSnapshot();
    } finally {
      await db.end();
    }
  });
});
