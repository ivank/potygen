import { Parser } from '@ikerin/rd-parse';
import { convert } from '../src/convert';
import { SqlGrammar } from '../src/sql.grammar';

const parser = Parser(SqlGrammar);
describe('Convert', () => {
  it.each<[string, string]>([
    ['static fields', `SELECT col1 as "col1", col2 as "myCol2" FROM table1`],
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
    expect(convert({ params: [], result: [] }, parser(sql))).toMatchSnapshot();
  });
});
