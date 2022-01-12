import { sql } from '@potygen/query';

export const myQuery = sql`
  WITH nums AS (SELECT id, numeric_col AS "num" FROM all_types)
  SELECT all_types.text_col, n.id FROM all_types JOIN nums AS n ON n.id = all_types.id
`;
