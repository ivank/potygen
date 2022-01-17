import { sql as otherSql } from '@potygen/potygen';

const sql = (test: TemplateStringsArray) => '';

export const tag = sql`NOT SQL TEMPLATE`;
export const sql2 = otherSql<any>`
  SELECT character_col
  FROM all_types
  WHERE integer_col > COALESCE($id, 2)`;
