import { loadAllData, toInfoContext, InfoContext, completionAtOffset, quickInfoAtOffset } from '../src';
import { inspectError } from '../src/inspect';
import { testDb } from './helpers';

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
    name                 | sqlWithCaret
    ${`single column 1`} | ${`SELECT all_types.i‸d FROM all_types`}
    ${`single column 2`} | ${`SELECT all_types.‸id FROM all_types`}
    ${`single table`}    | ${`SELECT all_types.id FROM all_‸types`}
    ${`schema table`}    | ${`SELECT "FiTAccountId" FROM fit.‸FiTAccount`}
    ${`schema column`}   | ${`SELECT fit‸ FROM fit.FiTAccount`}
    ${`end of column`}   | ${`SELECT all_types.id‸ FROM all_types`}
    ${`empty_column`}    | ${`SELECT all_types.‸empty_column FROM all_types`}
    ${`partial from`}    | ${`SELECT all_types.id FROM a‸`}
    ${`enum right`}      | ${`SELECT * FROM all_types WHERE all_types.state = 'A‸ctive'`}
    ${`enum left`}       | ${`SELECT * FROM all_types WHERE 'A‸ctive' = all_types.state`}
  `(
    'Should load completions for $name: $sqlWithCaret',
    ({ name, sqlWithCaret }: { name: string; sqlWithCaret: string }) => {
      const offset = sqlWithCaret.indexOf('‸');
      const sql = sqlWithCaret.replace('‸', '');

      const completions = completionAtOffset(ctx, sql, offset);
      expect(completions).toMatchSnapshot(name);
    },
  );

  it.each`
    name            | sqlWithCaret
    ${`column`}     | ${`SELECT all_types.i‸d FROM all_types`}
    ${`source`}     | ${`SELECT all_ty‸pes.id FROM all_types`}
    ${`table`}      | ${`SELECT all_types.id FROM all‸_types`}
    ${`enum`}       | ${`SELECT all_types.sta‸te FROM all_types`}
    ${`composite`}  | ${`SELECT all_types.it‸em FROM all_types`}
    ${`enum right`} | ${`SELECT * FROM all_types WHERE all_types.state = 'A‸ctive'`}
    ${`enum left`}  | ${`SELECT * FROM all_types WHERE 'A‸ctive' = all_types.state`}
  `(
    'Should load quick info for $name: $sqlWithCaret',
    ({ name, sqlWithCaret }: { name: string; sqlWithCaret: string }) => {
      const offset = sqlWithCaret.indexOf('‸');
      const sql = sqlWithCaret.replace('‸', '');

      const info = quickInfoAtOffset(ctx, sql, offset);
      expect(info).toMatchSnapshot(name);
    },
  );

  it.each`
    name             | sql
    ${`no select`}   | ${`SELECT  FROM all_types`}
    ${`wrong order`} | ${`SELECT * FORM all_types`}
  `('Should inspect for errors for $name: $sql', ({ name, sql }: { name: string; sql: string }) => {
    const info = inspectError(ctx, sql);
    expect(info).toMatchSnapshot(name);
  });
});
