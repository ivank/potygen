import { Client } from 'pg';
import {
  parser,
  toQueryInterface,
  loadQueryInterfacesData,
  toLoadedQueryInterface,
  TypeConstant,
  TypeName,
} from '@potygen/potygen';
import { createPrinter, NewLineKind } from 'typescript';
import { toTypeSource, compactTypes } from '../src';
import { testDb } from './helpers';

let db: Client;

describe('Query Interface', () => {
  beforeAll(async () => {
    db = testDb();
    await db.connect();
  });

  afterAll(() => db.end());

  it.each<[string, string]>([
    ['function result single', `SELECT ABS(integer_col) FROM all_types`],
    ['function result double', `SELECT ABS(ABS(integer_col)) FROM all_types`],
    ['load nullable column', `SELECT integer_col FROM all_types`],
    ['load non nullable column', `SELECT not_null FROM all_types`],
    ['load nullable column', `SELECT integer_col::text FROM all_types`],
    ['load non nullable column', `SELECT not_null::text FROM all_types`],
    ['nullability', `SELECT not_null FROM all_types`],
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
    ['parameter group collapse', `SELECT id FROM all_types WHERE $q = '' OR character_varying_col = $q`],
  ])('Should convert %s sql (%s)', async (path, content) => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const printer = createPrinter({ newLine: NewLineKind.LineFeed });
    const { ast } = parser(content);
    const queryInterface = toQueryInterface(ast);

    const data = await loadQueryInterfacesData({ db, logger }, [queryInterface], []);
    const loadedQuery = toLoadedQueryInterface(data)(queryInterface);
    const source = toTypeSource({ type: 'sql', path, content, queryInterface, loadedQuery });
    expect(printer.printFile(source)).toMatchSnapshot();
  });

  it.each<[string, TypeConstant[], TypeConstant[]]>([
    [
      'single value literal',
      [
        { type: TypeName.Boolean, literal: true, postgresType: 'boolean' },
        { type: TypeName.Boolean, postgresType: 'boolean' },
      ],
      [{ type: TypeName.Boolean, postgresType: 'boolean' }],
    ],
    [
      'keep if no need to compact',
      [
        { type: TypeName.String, literal: 'tmp', postgresType: 'text' },
        { type: TypeName.String, literal: 'tmp2', postgresType: 'text' },
      ],
      [
        { type: TypeName.String, literal: 'tmp', postgresType: 'text' },
        { type: TypeName.String, literal: 'tmp2', postgresType: 'text' },
      ],
    ],
    [
      'compact if at least one non literal',
      [
        { type: TypeName.String, literal: 'tmp', postgresType: 'text' },
        { type: TypeName.String, literal: 'tmp2', postgresType: 'text' },
        { type: TypeName.String, postgresType: 'text' },
      ],
      [{ type: TypeName.String, postgresType: 'text' }],
    ],
  ])('Should compact union types for %s', async (_, types, expected) => {
    expect(compactTypes(types)).toEqual(expected);
  });
});
