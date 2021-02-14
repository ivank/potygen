import { Parser, ParserError } from '@ikerin/rd-parse';
import { PgSql } from '../../src/index';
import { inspect } from 'util';

const pgsqlParser = Parser(PgSql);

describe('Sql', () => {
  it.each`
    name                              | sql
    ${'star select'}                  | ${'SELECT *'}
    ${'qualified star select'}        | ${'SELECT table.*'}
    ${'deep qualified star select'}   | ${'SELECT table1.table2.*'}
    ${'quoted star select'}           | ${'SELECT "table 2".*'}
    ${'deep quoted star select'}      | ${'SELECT "table 1"."table 2".*'}
    ${'deeper quoted star select'}    | ${'SELECT "table 1".table2."table 3".*'}
    ${'column select'}                | ${'SELECT column'}
    ${'qualified column select'}      | ${'SELECT table.column'}
    ${'deep qualified column select'} | ${'SELECT schema.table.column'}
    ${'multiple columns select'}      | ${'SELECT column1, column2'}
    ${'deep multiple columns select'} | ${'SELECT column1, table1.column2, table1.column3, schema.table3.colum2'}
    ${'as select'}                    | ${'SELECT column as col1'}
    ${'quoted as select'}             | ${'SELECT table.column as "col 1"'}
    ${'quoted escaped as select'}     | ${'SELECT schema.table.column as "col ""2"""'}
    ${'multiple as columns select'}   | ${'SELECT column1 as "test", table1.column2, "test".column2 as col1'}
    ${'limit'}                        | ${'SELECT * LIMIT 10'}
    ${'from'}                         | ${'SELECT * FROM jobs'}
    ${'from select'}                  | ${'SELECT * FROM (SELECT * FROM jobs2) as jobs1'}
    ${'from select as'}               | ${'SELECT * FROM jobs1, (SELECT * FROM jobs2)'}
    ${'from with as'}                 | ${'SELECT * FROM jobs AS test'}
    ${'from with as quoted'}          | ${'SELECT * FROM jobs AS "test 2"'}
    ${'multiple from'}                | ${'SELECT * FROM jobs1, jobs AS "test 2"'}
    ${'multiple from as'}             | ${'SELECT * FROM jobs1 AS j1, jobs2, jobs3 as j3'}
    ${'join'}                         | ${'SELECT * FROM jobs JOIN test1'}
    ${'inner join'}                   | ${'SELECT * FROM jobs INNER JOIN test1'}
    ${'left join'}                    | ${'SELECT * FROM jobs LEFT JOIN test1'}
    ${'left outer join'}              | ${'SELECT * FROM jobs LEFT OUTER JOIN test1'}
    ${'right join'}                   | ${'SELECT * FROM jobs RIGHT JOIN test1'}
    ${'right outer join'}             | ${'SELECT * FROM jobs RIGHT OUTER JOIN test1'}
    ${'full join'}                    | ${'SELECT * FROM jobs FULL JOIN test1'}
    ${'full outer join'}              | ${'SELECT * FROM jobs FULL OUTER JOIN test1'}
    ${'cross join'}                   | ${'SELECT * FROM jobs CROSS JOIN test1'}
    ${'multiple joins'}               | ${'SELECT * FROM jobs JOIN test1 JOIN test2'}
    ${'where'}                        | ${'SELECT * WHERE id = 5'}
    ${'where select'}                 | ${'SELECT * WHERE (SELECT id FROM test LIMIT 1) = 5'}
    ${'quoted identifier'}            | ${'SELECT "test"'}
    ${'quoted identifier escaped'}    | ${'SELECT "test me ""o donald"" true"'}
  `('Should parse simple sql $name ($sql)', ({ sql, name }) => {
    try {
      expect(pgsqlParser(sql)).toMatchSnapshot(name);
    } catch (e) {
      if (e instanceof ParserError) {
        console.log(inspect(e, { depth: 10, colors: true }));
      }
      throw e;
    }
  });
});
