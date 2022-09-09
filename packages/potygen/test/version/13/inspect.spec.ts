import { loadAllData, toInfoContext, InfoContext, quickInfoAtOffset } from '../../../src';
import { testDb } from '../../helpers';

let ctx: InfoContext;

describe('Inspect', () => {
  beforeAll(async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const db = testDb();
    await db.connect();
    ctx = toInfoContext(await loadAllData({ db, logger }, []), logger);
    await db.end();
  });

  it.each`
    name                             | sqlWithCaret
    ${`generated column`}            | ${`SELECT contacts.ts_‸vector_search FROM specific_pg_version.contacts`}
    ${`table with generated column`} | ${`SELECT contacts FROM specific_pg_version.cont‸acts`}
  `(
    'Should load quick info for $name: $sqlWithCaret',
    ({ name, sqlWithCaret }: { name: string; sqlWithCaret: string }) => {
      const offset = sqlWithCaret.indexOf('‸');
      const sql = sqlWithCaret.replace('‸', '');

      const info = quickInfoAtOffset(ctx, sql, offset);
      expect(info).toMatchSnapshot(name);
    },
  );
});
