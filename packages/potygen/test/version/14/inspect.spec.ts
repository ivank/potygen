import { loadAllData, toInfoContext, InfoContext, completionAtOffset } from '../../../src';
import { testDb } from '../../helpers';

let ctx: InfoContext;

describe('Inspect', () => {
  beforeAll(async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    const db = testDb();
    await db.connect();
    ctx = toInfoContext(await loadAllData({ db, logger }, []), logger);
    await db.end();
  }, 20000);

  it.each`
    name                  | sqlWithCaret
    ${`select cast type`} | ${`SELECT 'Active'::s‸t`}
  `(
    'Should load completions for $name: $sqlWithCaret',
    ({ name, sqlWithCaret }: { name: string; sqlWithCaret: string }) => {
      const offset = sqlWithCaret.indexOf('‸');
      const sql = sqlWithCaret.replace('‸', '');

      const completions = completionAtOffset(ctx, sql, offset);
      expect(completions).toMatchSnapshot(name);
    },
  );
});
