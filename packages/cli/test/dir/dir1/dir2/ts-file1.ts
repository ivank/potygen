import { sql } from '@psql-ts/query';

export const sql1 = sql`SELECT * FROM all_types`;

export const sql2 = sql`
  SELECT id, character_col
  FROM all_types
  WHERE id = :id
`;
