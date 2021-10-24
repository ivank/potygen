import { parser } from '../src';
import { withParserErrors } from './helpers';

describe('Sql', () => {
  it.each`
    name                              | sql
    ${'null'}                         | ${'SELECT NULL'}
    ${'null where'}                   | ${'SELECT col1 FROM table1 WHERE name IS NULL'}
    ${'unary'}                        | ${'SELECT NOT TRUE'}
    ${'unary where'}                  | ${'SELECT col1 FROM table1 WHERE name IS NOT NULL'}
    ${'string'}                       | ${"SELECT 'test'"}
    ${'dollar quoted string'}         | ${"SELECT $$Dianne's horse$$"}
    ${'customdollar quoted string'}   | ${"SELECT $SomeTag$Dianne's horse$SomeTag$"}
    ${'parameter in select'}          | ${'SELECT :test1'}
    ${'parameter in where'}           | ${'SELECT * FROM table1 WHERE table1.col = :test1'}
    ${'parameter in join with 2'}     | ${'SELECT * FROM table1 JOIN table2 ON table1.id = table2.id AND table1.col = :test1 WHERE table2.col = :test2'}
    ${'parameter in having'}          | ${'SELECT * HAVING table1.col = :test1'}
    ${'parameter in select'}          | ${'SELECT :test1!'}
    ${'parameter in where'}           | ${'SELECT * FROM table1 WHERE table1.col = :test1!'}
    ${'parameter in join with 2'}     | ${'SELECT * FROM table1 JOIN table2 ON table1.id = table2.id AND table1.col = :test1! WHERE table2.col = :test2'}
    ${'parameter in having'}          | ${'SELECT * HAVING table1.col = :test1'}
    ${'parameter in select'}          | ${'SELECT $test1!'}
    ${'parameter in where'}           | ${'SELECT * FROM table1 WHERE table1.col = $test1!'}
    ${'parameter in join with 2'}     | ${'SELECT * FROM table1 JOIN table2 ON table1.id = table2.id AND table1.col = $test1! WHERE table2.col = $test2'}
    ${'parameter in having'}          | ${'SELECT * HAVING table1.col = $test1'}
    ${'binary sum'}                   | ${'SELECT 1 + 2'}
    ${'binary sub'}                   | ${'SELECT 1 - 2'}
    ${'binary div'}                   | ${'SELECT 1 / 2'}
    ${'binary mul'}                   | ${'SELECT 1 * 2'}
    ${'binary sum, sub'}              | ${'SELECT 1 - 2 + 2'}
    ${'binary sum, div, mul'}         | ${'SELECT (1 + 2) / (20 * 32)'}
    ${'string concat'}                | ${"SELECT 'test' || 'other'"}
    ${'json field int'}               | ${'SELECT col1->1 FROM table1'}
    ${'json field string'}            | ${"SELECT col1->'col' FROM table1"}
    ${'json field text string'}       | ${"SELECT col1->>'col' FROM table1"}
    ${'json field text int'}          | ${'SELECT col1->>2 FROM table1'}
    ${'json path'}                    | ${"SELECT col1#>'{a,b}' FROM table1"}
    ${'json path text'}               | ${"SELECT col1#>>'{a,b}' FROM table1"}
    ${'json contain left'}            | ${'SELECT * FROM table1 WHERE col1 @> \'{"a":2}\''}
    ${'json contain right'}           | ${'SELECT * FROM table1 WHERE col1 <@ \'{"a":2}\''}
    ${'json key exists'}              | ${"SELECT * FROM table1 WHERE col1 ? 'a'"}
    ${'json keys any include'}        | ${"SELECT * FROM table1 WHERE col1 ?| array['b', 'c']"}
    ${'json delete key'}              | ${"SELECT * FROM table1 WHERE col1 #- '{1,b}'"}
    ${'star select'}                  | ${'SELECT *'}
    ${'qualified star select'}        | ${'SELECT table1.*'}
    ${'const select'}                 | ${"SELECT '2018-01-01'"}
    ${'deep qualified star select'}   | ${'SELECT table1.table2.*'}
    ${'quoted star select'}           | ${'SELECT "table 2".*'}
    ${'deep quoted star select'}      | ${'SELECT "table 1"."table 2".*'}
    ${'column select'}                | ${'SELECT column1'}
    ${'qualified column select'}      | ${'SELECT table1.column1'}
    ${'deep qualified column select'} | ${'SELECT schema1.table1.column1'}
    ${'multiple columns select'}      | ${'SELECT column1, column2'}
    ${'deep multiple columns select'} | ${'SELECT column1, table1.column2, table1.column3, schema1.table3.colum2'}
    ${'as select'}                    | ${'SELECT column1 as col1'}
    ${'quoted as select'}             | ${'SELECT table1.column1 as "col 1"'}
    ${'quoted escaped as select'}     | ${'SELECT schema1.table1.column1 as "col ""2"""'}
    ${'multiple as columns select'}   | ${'SELECT column1 as "test", table1.column2, "test".column2 as col1'}
    ${'cast'}                         | ${'SELECT CAST(id AS int4)'}
    ${'cast number'}                  | ${'SELECT CAST(20 AS int4)'}
    ${'cast string'}                  | ${"SELECT CAST('test' AS varchar(20))"}
    ${'select count distinct'}        | ${'SELECT COUNT(DISTINCT accounts.id)::int as total'}
    ${'select count filter'}          | ${'SELECT (COUNT(account_levelisations.id) FILTER (WHERE account_levelisations.state = \'Pending\'))::int AS "pendingCount" FROM account_levelisations'}
    ${'param specific type'}          | ${'SELECT * FROM table1 WHERE ($active::BOOLEAN IS NULL OR $active::BOOLEAN = (case when table1.url IS NOT NULL then FALSE else TRUE end))'}
    ${'limit'}                        | ${'SELECT * LIMIT 10'}
    ${'offset'}                       | ${'SELECT * OFFSET 10'}
    ${'limit offset'}                 | ${'SELECT * LIMIT 10 OFFSET 10'}
    ${'from'}                         | ${'SELECT * FROM jobs'}
    ${'from with schema'}             | ${'SELECT * FROM public.jobs'}
    ${'from select'}                  | ${'SELECT * FROM (SELECT * FROM jobs2) as jobs1'}
    ${'from select as'}               | ${'SELECT * FROM jobs1, (SELECT * FROM jobs2) as tmp2'}
    ${'from with as'}                 | ${'SELECT * FROM jobs AS test'}
    ${'from with as short'}           | ${'SELECT * FROM jobs test'}
    ${'from with as quoted'}          | ${'SELECT * FROM jobs AS "test 2"'}
    ${'multiple from'}                | ${'SELECT * FROM jobs1, jobs AS "test 2"'}
    ${'multiple from as'}             | ${'SELECT * FROM jobs1 AS j1, jobs2, jobs3 as j3'}
    ${'join'}                         | ${'SELECT * FROM jobs JOIN test1'}
    ${'join with schema'}             | ${'SELECT * FROM public.jobs JOIN public.test1'}
    ${'join as'}                      | ${'SELECT * FROM jobs JOIN test1 AS my_test'}
    ${'join as quoted'}               | ${'SELECT * FROM jobs JOIN test1 AS "myTest"'}
    ${'join on'}                      | ${'SELECT * FROM jobs JOIN test1 ON jobs.id = test1.id'}
    ${'join on as'}                   | ${'SELECT * FROM jobs JOIN test1 AS my_test ON jobs.id = test1.id'}
    ${'join on as quoted'}            | ${'SELECT * FROM jobs JOIN test1 AS "myTest" ON jobs.id = test1.id'}
    ${'join on'}                      | ${'SELECT * FROM jobs JOIN test1 ON jobs.id = test1.id'}
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
    ${'where and'}                    | ${"SELECT * WHERE id = 5 AND name = 'test'"}
    ${'where boolean'}                | ${'SELECT * WHERE id = 5 AND TRUE'}
    ${'where greater than'}           | ${'SELECT * WHERE table1.col > 2'}
    ${'where less than'}              | ${'SELECT * WHERE table1.col < 2'}
    ${'where different from'}         | ${"SELECT * WHERE table1.col <> '23'"}
    ${'where not equal to'}           | ${"SELECT * WHERE table1.col != '23'"}
    ${'where greater than or equal'}  | ${'SELECT * WHERE table1.col >= 23'}
    ${'where less than or equal'}     | ${"SELECT * WHERE table1.col <= '23'"}
    ${'where like string'}            | ${"SELECT * WHERE table1.col LIKE '%23%'"}
    ${'where ilike string'}           | ${"SELECT * WHERE table1.col ILIKE '23%'"}
    ${'between'}                      | ${"SELECT * WHERE table1.col BETWEEN '2006-01-01' AND '2007-01-01'"}
    ${'where select'}                 | ${'SELECT * WHERE (SELECT id FROM test LIMIT 1) = 5'}
    ${'quoted identifier'}            | ${'SELECT "test"'}
    ${'quoted identifier escaped'}    | ${'SELECT "test me ""o donald"" true"'}
    ${'union'}                        | ${'SELECT * FROM table1 UNION SELECT * FROM table2'}
    ${'intersect'}                    | ${'SELECT * FROM table1 INTERSECT SELECT * FROM table2'}
    ${'except'}                       | ${'SELECT * FROM table1 EXCEPT SELECT * FROM table2'}
    ${'order by'}                     | ${'SELECT * FROM table1 ORDER BY col ASC'}
    ${'order by qualified'}           | ${'SELECT * FROM table1 mr ORDER BY mr."DateOfReading" ASC'}
    ${'order by multiple'}            | ${'SELECT * FROM table1 ORDER BY col1 ASC, col2'}
    ${'order by with params'}         | ${"SELECT * FROM table1 ORDER BY CASE WHEN $param1 = 'val1' AND $param2 = 'DESC' THEN col2 END DESC"}
    ${'group by'}                     | ${'SELECT * FROM table1 GROUP BY col'}
    ${'group by multiple'}            | ${'SELECT * FROM table1 GROUP BY col1, col2'}
    ${'pg cast column to int'}        | ${'SELECT test::int FROM table1'}
    ${'pg cast column to decimal'}    | ${'SELECT test::decimal(10,2) FROM table1'}
    ${'pg cast column to varchar'}    | ${'SELECT test::varchar(10) FROM table1'}
    ${'pg cast string to date'}       | ${"SELECT '2016-01-01'::date FROM table1"}
    ${'nested select'}                | ${'SELECT test, (SELECT id FROM table2 LIMIT 1) FROM table1'}
    ${'pg cast nested select'}        | ${'SELECT test::date, (SELECT id FROM table2 LIMIT 1)::int FROM table1'}
    ${'comments'}                     | ${'-- test\nSELECT "test"\n-- other\n'}
    ${'case with else'}               | ${'SELECT CASE test1 WHEN 1 THEN TRUE WHEN 2 THEN FALSE ELSE 0 END'}
    ${'case without expression'}      | ${'SELECT CASE WHEN test1 <> 1 THEN TRUE WHEN test1 <> 2 THEN FALSE ELSE 0 END'}
    ${'case no else and expression'}  | ${'SELECT CASE WHEN test1 <> 1 THEN TRUE WHEN test1 <> 2 THEN FALSE END'}
    ${'case no else'}                 | ${'SELECT CASE test1 WHEN 1 THEN TRUE WHEN 2 THEN FALSE END'}
    ${'where case'}                   | ${"SELECT col1 WHERE table2.col2 = CASE table2.col3 WHEN 'test1' THEN 1 WHEN 'test2' THEN 2 END"}
    ${'union select'}                 | ${'SELECT col1, col2 FROM table1 UNION SELECT col1, col2 FROM table2'}
    ${'intersect select'}             | ${'SELECT col1, col2 FROM table1 INTERSECT SELECT col1, col2 FROM table2'}
    ${'except select'}                | ${'SELECT col1, col2 FROM table1 EXCEPT SELECT col1, col2 FROM table2'}
    ${'update default'}               | ${'UPDATE table1 SET col1 = DEFAULT'}
    ${'update value'}                 | ${'UPDATE table1 SET col1 = 10'}
    ${'update list'}                  | ${'UPDATE table1 SET col1 = 10, col2 = "other"'}
    ${'update params'}                | ${'UPDATE table1 SET col1 = :param1, col2 = :param2'}
    ${'update multiple tables'}       | ${'UPDATE table1 SET col1 = table2.id FROM table2'}
    ${'update multiple as'}           | ${'UPDATE table1 SET col1 = my1.id, col2 = my2.id FROM table2 AS "my1", table3 AS my2'}
    ${'update as'}                    | ${'UPDATE table1 AS "my1" SET col1 = my2.col2'}
    ${'update map'}                   | ${'UPDATE table1 SET (col1, col2) = (DEFAULT, 10)'}
    ${'update map row'}               | ${'UPDATE table1 SET (col1, col2) = ROW ("12", FALSE)'}
    ${'update map select'}            | ${'UPDATE table1 SET (col1, col2) = (SELECT col3, col4 FROM table2 WHERE table2.id = table1.id)'}
    ${'update where'}                 | ${'UPDATE table1 SET deleted_at = TRUE WHERE id = :id'}
    ${'update returning star'}        | ${'UPDATE table1 SET col1 = 10 WHERE id = :id RETURNING *'}
    ${'update returning'}             | ${'UPDATE table1 SET col1 = 10 RETURNING id, col1'}
    ${'update returning expression'}  | ${"UPDATE table1 SET col1 = 10 RETURNING id, col1, 123 as col2, '2' as col3, 3+4 as col4"}
    ${'delete'}                       | ${'DELETE FROM table1'}
    ${'delete param'}                 | ${'DELETE FROM table1 WHERE id = :id'}
    ${'delete returning'}             | ${'DELETE FROM table1 USING table2 AS "my2" WHERE table1.id = my2.id AND deleted_at IS NOT NULL RETURNING id, col1'}
    ${'delete returning'}             | ${'DELETE FROM table1 RETURNING id, col2'}
    ${'insert'}                       | ${'INSERT INTO table1 (id, col1) VALUES (10,20),(30,40)'}
    ${'insert returning'}             | ${'INSERT INTO table1 (id, col1) VALUES (10,20),(30,40) RETURNING id, col1'}
    ${'insert select'}                | ${'INSERT INTO table1 SELECT id, col FROM table2'}
    ${'insert do nothing'}            | ${'INSERT INTO table1 VALUES (10, 20) ON CONFLICT DO NOTHING'}
    ${'insert do set'}                | ${'INSERT INTO table1 VALUES (10, 20) ON CONFLICT DO UPDATE SET id = EXCLUDED.id WHERE id > 10'}
    ${'insert conflict'}              | ${'INSERT INTO table1 VALUES (10, 20) ON CONFLICT (source_system_id) WHERE source_system_id IS NOT NULL DO UPDATE SET id = EXCLUDED.id WHERE id > 10'}
    ${'insert conflict list'}         | ${'INSERT INTO table1 VALUES (10, 20) ON CONFLICT (source_system_id, type) DO UPDATE SET id = EXCLUDED.id WHERE id > 10'}
    ${'coalesce'}                     | ${'SELECT COALESCE(id, TRUE) FROM table1'}
    ${'function'}                     | ${'SELECT MY_FUNCTION(id, TRUE) FROM table1'}
    ${'function in set'}              | ${'UPDATE table1 SET col1 = MY_FUNCTION(id, TRUE) RETURNING id, col1'}
    ${'function in where'}            | ${'SELECT id FROM table1 WHERE table1.col = ANY(table1.test) '}
    ${'function with order'}          | ${'SELECT ARRAY_AGG(id ORDER BY col1 DESC) FROM table1 GROUP BY table1.col2'}
    ${'nested function'}              | ${'SELECT id FROM table1 WHERE table1.col = ANY(ARRAY_AGG(table1.col2)) GROUP BY table1.col2'}
    ${'array'}                        | ${'SELECT ARRAY[1, 2]'}
    ${'array index'}                  | ${'SELECT arr[12]'}
    ${'array index expression'}       | ${'SELECT arr[12+3]'}
    ${'array index expression col'}   | ${'SELECT arr[table1.id+3] FROM table1'}
    ${'array index slice'}            | ${'SELECT (ARRAY[1,2,3,4])[2:3]'}
    ${'function with array'}          | ${"SELECT id FROM table1 WHERE table1.col = ANY(ARRAY['opening','Opening']) ORDER BY col ASC LIMIT 1"}
    ${'function with type cast'}      | ${'SELECT TRIM(name)::text FROM table1'}
    ${'array nested'}                 | ${"SELECT ARRAY[ARRAY[1,2], ARRAY['test','other']]"}
    ${'type array'}                   | ${'SELECT $test::int[]'}
    ${'type array nested'}            | ${'SELECT $test::int[][]'}
    ${'limit offset params'}          | ${'SELECT * FROM table1 LIMIT :param1 OFFSET :param2'}
    ${'limit offset param type'}      | ${'SELECT * FROM table1 LIMIT :param1::int OFFSET :param2::int'}
    ${'row'}                          | ${'SELECT ROW (1,2,3)'}
    ${'row shorthand'}                | ${'SELECT (1,2,3)'}
    ${'row complex'}                  | ${'SELECT (1, 2+2, 3), ROW (123), (1,2,(3))'}
    ${'where in tuples'}              | ${'SELECT col1, col2 WHERE (col1,col2) IN ((1,2),(3,4))'}
    ${'select exists'}                | ${'SELECT EXISTS(SELECT col2 FROM table2)'}
    ${'update exists'}                | ${'UPDATE table1 SET col1 = EXISTS(SELECT col2 FROM table2)'}
    ${'insert multiple param values'} | ${'INSERT INTO table1 VALUES $$rows(name, test)'}
    ${'spread param in clause'}       | ${'SELECT table_schema FROM information_schema.columns WHERE ((table_schema, table_name)) IN (($$tables(schema, table)))'}
    ${'select with select'}           | ${'WITH tmp AS (SELECT * FROM table1) SELECT id FROM table2 WHERE table2.id = tmp.col2'}
    ${'select with delete'}           | ${'WITH tmp AS (DELETE FROM table1 RETURNING id) SELECT id FROM table2 WHERE table2.id = tmp.col2'}
    ${'select with update'}           | ${'WITH tmp AS (UPDATE table1 SET col = 2 RETURNING id) SELECT id FROM table2 WHERE table2.id = tmp.col2'}
    ${'select with insert'}           | ${'WITH tmp AS (INSERT INTO table1(id) VALUES(2) RETURNING id) SELECT id FROM table2 WHERE table2.id = tmp.col2'}
    ${'update with select'}           | ${'WITH tmp AS (SELECT * FROM table1) UPDATE table2 SET col2 = tmp.id WHERE tmp.col2 = table2.id'}
    ${'update with delete'}           | ${'WITH tmp AS (DELETE FROM table1 RETURNING id, col2) UPDATE table2 SET col2 = tmp.id WHERE tmp.col2 = table2.id'}
    ${'update with update'}           | ${'WITH tmp AS (UPDATE table1 SET col = 2 RETURNING id, col2) UPDATE table2 SET col2 = tmp.id WHERE tmp.col2 = table2.id'}
    ${'update with insert'}           | ${'WITH tmp AS (INSERT INTO table1(id) VALUES(2) RETURNING id, col2) UPDATE table2 SET col2 = tmp.id WHERE tmp.col2 = table2.id'}
    ${'delete with select'}           | ${'WITH tmp AS (SELECT * FROM table1) DELETE FROM table2 WHERE tmp.col2 = table2.id'}
    ${'delete with delete'}           | ${'WITH tmp AS (DELETE FROM table1 RETURNING id, col2) DELETE FROM table2 WHERE tmp.col2 = table2.id'}
    ${'delete with update'}           | ${'WITH tmp AS (UPDATE table1 SET col = 2 RETURNING id, col2) DELETE FROM table2 WHERE tmp.col2 = table2.id'}
    ${'delete with insert'}           | ${'WITH tmp AS (INSERT INTO table1(id) VALUES(2) RETURNING id, col2) DELETE FROM table2 WHERE tmp.col2 = table2.id'}
    ${'insert with select'}           | ${'WITH tmp AS (SELECT * FROM table1) INSERT INTO table2 SELECT * FROM tmp'}
    ${'insert with delete'}           | ${'WITH tmp AS (DELETE FROM table1 RETURNING id, col2) INSERT INTO table2 SELECT * FROM tmp'}
    ${'insert with update'}           | ${'WITH tmp AS (UPDATE table1 SET col = 2 RETURNING id, col2) INSERT INTO table2 SELECT * FROM tmp'}
    ${'insert with insert'}           | ${'WITH tmp AS (INSERT INTO table1(id) VALUES(2) RETURNING id, col2) INSERT INTO table2 SELECT * FROM tmp'}
  `('Should parse simple sql $name ($sql)', ({ sql, name }) =>
    withParserErrors(() => {
      expect(parser(sql)).toMatchSnapshot(name);
    }),
  );
});
