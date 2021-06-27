import { Parser } from '@ikerin/rd-parse';
import { convertSelect } from '../src/convert';
import { SqlGrammar } from '../src/sql.grammar';

const parser = Parser(SqlGrammar);
describe('Convert', () => {
  it.each<[string, string]>([
    ['between fields named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['between fields not named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields named', `SELECT FALSE as "col1", TRUE as "col2"`],
    ['boolean fields mixed', `SELECT FALSE, TRUE as "col2"`],
    ['boolean fields not named', `SELECT FALSE, TRUE`],
    ['string fields not named', `SELECT 'test', $$Dianne's horse$$, $SomeTag$Dianne's horse$SomeTag$`],
    ['static fields', `SELECT col1 as "col1", col2 as "myCol2" FROM table1`],
    ['case', `SELECT CASE WHEN TRUE THEN TRUE ELSE 'other' END`],
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
  ])('Should convert %s sql (%s)', (_, sql) => {
    expect(convertSelect({ params: [], result: [] }, parser(sql))).toMatchSnapshot();
  });
});
