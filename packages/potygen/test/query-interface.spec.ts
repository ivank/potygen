import { parser, toQueryInterface } from '../src';
import { withParserErrors } from './helpers';

describe('Query Interface', () => {
  it.each<[string, string]>([
    ['cte with values', `WITH ins(id, val) AS (VALUES (1::int, 2::int),(3::int, 4::int)) SELECT * FROM ins`],
    ['between fields not named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields mixed', `SELECT FALSE, TRUE as "col2"`],
    ['boolean fields not named', `SELECT FALSE, TRUE`],
    ['cast with schema', `SELECT 'text'::information_schema.sql_identifier`],
    ['function with star', `SELECT information_schema._pg_truetypmod(a.*, t.*) FROM table1`],
    ['composite type from table', `SELECT (item).supplier_id FROM all_types`],
    ['function with schema', `SELECT information_schema._pg_char_max_length('123')`],
    ['binary expression numbers', `SELECT 1+2`],
    ['from select', `SELECT id FROM all_types`],
    ['binary expression string', `SELECT 'test' || 'other'`],
    ['binary expression column', `SELECT (col1 + col2) AS "res1" FROM table1`],
    ['string fields not named', `SELECT 'test', $$Dianne's horse$$, $SomeTag$Dianne's horse$SomeTag$`],
    ['static fields', `SELECT col1 as "col1", col2 as "myCol2" FROM table1`],
    ['case', `SELECT CASE WHEN TRUE THEN TRUE ELSE 'other' END`],
    [
      'case columns',
      `
        SELECT
          CASE col1
            WHEN 12 THEN table1.col1
            WHEN 20 THEN col2
            ELSE 'other'
          END AS "res1"
        FROM table1
      `,
    ],
    [
      'join fields',
      `
        SELECT
          t1.col1 as "col1",
          t1.col2 as "myCol2",
          table2.col2 as "other"
        FROM table1 AS t1
        JOIN table2 ON table2.id = table1.id
      `,
    ],
    [
      'join with aliases fields',
      `
        SELECT
          t1.col1 as "col1",
          t1.col2 as "myCol2",
          myT2.col2 as "other",
          myT4.col_9 as "test"
        FROM fit.table1 AS t1
        JOIN fit.table2 as "myT2" ON table2.id = table1.id
        JOIN table3 as "myT4" ON myT2.id = table1.id
      `,
    ],
    ['single param', `SELECT :test1 AS "res1"`],
    ['multiple params', `SELECT :test1 AS "res1", :test2`],
    [
      'where params',
      `
        SELECT col1, col2
        FROM table1
        WHERE
          table1.id = :id
          AND col1 > :val1
      `,
    ],
    [
      'nested select',
      `
        SELECT
          col1 AS "res1",
          (SELECT id FROM table2 JOIN table3 ON table3.id = table2.id AND table3.val > :joinVal LIMIT 1)
        FROM table1
        WHERE :id = table1.id
      `,
    ],
    [
      'combination select',
      `
        SELECT
          col1 AS "res1",
          (SELECT id FROM table2 JOIN table3 ON table3.id = table2.id AND table3.val > :joinVal LIMIT 1)
        FROM table1
        UNION
        SELECT
          col1 AS "res1",
          table4.col2
        FROM table4
        WHERE :id = table1.id AND table4.id = :id
      `,
    ],
    ['multiple params infer type from one 1', `SELECT col1 FROM table1 WHERE :id = table1.id AND :id`],
    ['params in array range', `SELECT (ARRAY[1,2,3,4])[$from:3]`],
    ['multiple params infer type from one 2', `SELECT col1 FROM table1 WHERE :id IS NOT NULL OR :id = table1.id`],
    ['typed param in where', `SELECT col1 FROM table1 WHERE :id::int IS NOT NULL`],
    ['typed array param in select', `SELECT :param::int[]`],
    ['nested typed array param in select', `SELECT :param::int[][][]`],
    ['function', `SELECT ABS(id) FROM table1`],
    ['function param', `SELECT ABS($id) FROM table1`],
    ['enum type', `SELECT id::custom_type FROM table1`],
    ['limit and offset params', `SELECT id FROM table1 LIMIT :limit OFFSET :offset::int`],
    ['complex row', `SELECT (1, 2+2, :param1), ROW (123), (1,2,(3))`],
    ['star', `SELECT * FROM table1`],
    ['update returning star', 'UPDATE table1 SET col1 = 10 WHERE id = :id RETURNING *'],
    ['update returning', 'UPDATE table1 SET col1 = 10 RETURNING id, col1'],
    [
      'update returning expression',
      "UPDATE table1 SET col1 = 10 RETURNING id, col1, 123 as col2, '2' as col3, 3+4 as col4",
    ],
    ['insert returning star', 'INSERT INTO table1 (id) VALUES (1),(2) RETURNING *'],
    ['simple delete', 'DELETE FROM table1'],
    ['delete with param', 'DELETE FROM table1 WHERE id = :id'],
    ['delete with returning', 'DELETE FROM table1 RETURNING id, col2'],
    [
      'order by with params',
      "SELECT * FROM table1 ORDER BY CASE WHEN $param1 = 'val1' AND $param2 = 'DESC' THEN col2 END DESC",
    ],
    ['insert multiple param values', 'INSERT INTO table1 VALUES $$rows(name, test)'],
    ['nested functions', 'SELECT ABS(ARRAY_LENGTH(ARRAY_AGG(integer_col), 1)) FROM all_types GROUP BY id'],
    ['Extract const', "SELECT EXTRACT(CENTURY FROM TIMESTAMP '2000-12-16 12:21:13')"],
    [
      'Coalesce binary expression',
      `SELECT COALESCE(numeric_col,0) + COALESCE(numeric_col,0) as "totalPaymentWithVat" FROM all_types`,
    ],
    ['numeric', "SELECT '123'::numeric"],
    ['double percision', "SELECT '123'::double precision"],
    ['big int', "SELECT '123'::int8"],
  ])('Should convert %s sql (%s)', (_, sql) =>
    withParserErrors(() => {
      expect(toQueryInterface(parser(sql).ast)).toMatchSnapshot();
    }),
  );
});
