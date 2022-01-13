import { loadAllData, LoadedData } from '@potygen/cli';
import { Source } from '@potygen/query';
import { toQuickInfo, QuickInfo, toLoadedSourceAtOffset } from '../src/traverse';
import { testDb } from './helpers';

let data: LoadedData[] = [];

describe('Test Service', () => {
  beforeAll(async () => {
    const db = testDb();
    await db.connect();
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    data = await loadAllData({ db, logger }, data);
    await db.end();
  });

  it.each<[string, number, Partial<Source> | undefined]>([
    [`SELECT all_types.id FROM all_types`, 17, { type: 'Table', table: 'all_types', name: 'all_types' }],
    [
      `SELECT all_types.id, t.id FROM all_types JOIN addresses t ON t.id = all_types.id`,
      23,
      { type: 'Table', name: 't', table: 'addresses' },
    ],
    [
      `SELECT all_types.id, t.id FROM all_types JOIN addresses t ON t.id = all_types.id`,
      78,
      { type: 'Table', name: 'all_types', table: 'all_types' },
    ],
    [
      `
  WITH nums AS (SELECT id, numeric_col AS "num" FROM all_types)
  SELECT all_types.id, nums.id FROM all_types JOIN nums ON nums.id = all_types.id
`,
      93,
      { type: 'Query', name: 'nums' },
    ],
    [
      `
  WITH nums AS (SELECT id, numeric_col AS "num" FROM all_types)
  SELECT all_types.id, n.id FROM all_types JOIN nums AS n ON n.id = all_types.id
`,
      90,
      { type: 'Query', name: 'n' },
    ],
    [`SELECT all_types.id, t.id FROM all_types JOIN addresses t ON t.id = all_types.id`, 50, undefined],
  ])('Should find in "%s" source at position %s', (sql, offset, expected) => {
    const source = toLoadedSourceAtOffset(sql, data, offset);
    if (expected) {
      expect(source).toMatchObject(expected);
    } else {
      expect(source).toBe(undefined);
    }
  });

  it.each<[string, number, Partial<QuickInfo> | undefined]>([
    [
      `
  WITH nums AS (SELECT id, numeric_col AS "num" FROM all_types)
  SELECT all_types.id, n.id FROM all_types JOIN nums AS n ON n.id = all_types.id
`,
      85,
      { text: 'Column: id Type: Number, Comment: null, Nullable: false' },
    ],
  ])('Should get quick info "%s" source at offset %s', (sql, offset, expected) => {
    const source = toQuickInfo(sql, data, offset);
    if (expected) {
      expect(source).toMatchObject(expected);
    } else {
      expect(source).toBe(undefined);
    }
  });

  // it('Should parse complex sql %s', () => {
  //   const doc = toDocument(`SELECT t.id, t.asd FROM all_types AS t`);
  //   console.log(getSourceItem(toPath(doc.ast, 16)));
  // });
});
