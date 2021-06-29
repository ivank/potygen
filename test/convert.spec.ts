import { Parser } from '@ikerin/rd-parse';
import { convertSelect } from '../src/query-interface';
import { SqlGrammar } from '../src/sql.grammar';

const parser = Parser(SqlGrammar);
describe('Convert', () => {
  it.each<[string, string]>([
    ['between fields named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['between fields not named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields mixed', `SELECT FALSE, TRUE as "col2"`],
    ['boolean fields not named', `SELECT FALSE, TRUE`],
    ['binary expression numbers', `SELECT 1+2`],
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
    [
      'multiple params infer type from one 1',
      `
        SELECT col1
        FROM table1
        WHERE :id = table1.id AND :id
      `,
    ],
    [
      'multiple params infer type from one 2',
      `
        SELECT col1
        FROM table1
        WHERE :id IS NOT NULL OR :id = table1.id
      `,
    ],
  ])('Should convert %s sql (%s)', (_, sql) => {
    expect(convertSelect(parser(sql))).toMatchSnapshot();
  });
});
