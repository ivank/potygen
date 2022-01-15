import { correctEmptyIdentifierAfterDot } from '../src/helpers';

describe('Inspect', () => {
  it.each`
    sqlWithCaret                             | expected
    ${`SELECT all_types.i‸d FROM all_types`} | ${`SELECT all_types.id FROM all_types`}
    ${`SELECT all_types.id‸ FROM all_types`} | ${`SELECT all_types.id FROM all_types`}
    ${`SELECT all_types.‸ FROM all_types`}   | ${`SELECT all_types.unknown_column FROM all_types`}
    ${`SELECT all_types‸. FROM all_types`}   | ${`SELECT all_types. FROM all_types`}
  `(
    'Should load completions for $sqlWithCaret',
    ({ sqlWithCaret, expected }: { sqlWithCaret: string; expected: string }) => {
      const offset = sqlWithCaret.indexOf('‸');
      const sql = sqlWithCaret.replace('‸', '');

      expect(correctEmptyIdentifierAfterDot(sql, offset)).toEqual(expected);
    },
  );
});
