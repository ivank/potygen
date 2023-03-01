import { sql, Query } from '../src';
import { toQueryConfig } from '../src/sql';
import { withParserErrors } from './helpers';

describe('Template Tag', () => {
  it.each<[string, Query, Record<string, unknown>, { text: string; values: unknown[] }]>([
    [
      'params with accessors',
      sql`SELECT * FROM table1 WHERE id = $test.id`,
      { test: { id: 2, param: 'other' } },
      { text: 'SELECT * FROM table1 WHERE id = $1', values: [2] },
    ],
    [
      'multiple params with and without accessors',
      sql`SELECT * FROM table1 WHERE id = $test.id! AND col2 = $test.param AND other_id = $test.id!::int`,
      { test: { id: 2, param: 'other' } },
      { text: 'SELECT * FROM table1 WHERE id = $1 AND col2 = $2 AND other_id = $1::int4', values: [2, 'other'] },
    ],
    [
      'Multiple params',
      sql`SELECT * FROM table1 WHERE id IN $$ids`,
      { ids: [1, 2, 3] },
      { text: 'SELECT * FROM table1 WHERE id IN ($1,$2,$3)', values: [1, 2, 3] },
    ],
    [
      'Multiple insert values with two columns and spread with quoted names',
      sql`
        INSERT INTO table1 (
          col1,
          col2
        )
        VALUES
          $$rows(
            name,
            "test name"
          )
        `,
      {
        rows: [
          { name: 1, ['test name']: 'c' },
          { name: 2, ['test name']: 'a' },
        ],
      },
      {
        text: `
        INSERT INTO table1 (
          col1,
          col2
        )
        VALUES
          ($1,$2),($3,$4)
        `,
        values: [1, 'c', 2, 'a'],
      },
    ],
    [
      'Multiple insert values with parameter picks and type casts',
      sql`
        INSERT INTO table1 (
          col1,
          col2,
          col3,
          col4
        )
        VALUES
          $$rows(
            name::int,
            "test name"::text,
            state::account_state,
            lastCol
          )
        `,
      {
        rows: [
          { name: 1, ['test name']: 'c', state: 'Live', lastCol: new Date('2020-01-01') },
          { name: 2, ['test name']: 'a', state: 'Closed', lastCol: new Date('2020-01-01') },
        ],
      },
      {
        text: `
        INSERT INTO table1 (
          col1,
          col2,
          col3,
          col4
        )
        VALUES
          ($1::int4,$2::text,$3::account_state,$4),($5::int4,$6::text,$7::account_state,$8)
        `,
        values: [1, 'c', 'Live', new Date('2020-01-01'), 2, 'a', 'Closed', new Date('2020-01-01')],
      },
    ],
    [
      'Spread objects with excess items',
      sql`WITH items (col1) AS (VALUES $$rows(name)) SELECT * FROM items WHERE items.col1 > $maxCol`,
      {
        rows: [
          { name: 1, test2: 'b', test3: 'c' },
          { name: 2, test2: 'a', test3: 'z' },
          { name: 3, test2: 'd', test3: 'f' },
        ],
        maxCol: 123,
      },
      {
        text: `WITH items (col1) AS (VALUES ($1),($2),($3)) SELECT * FROM items WHERE items.col1 > $4`,
        values: [1, 2, 3, 123],
      },
    ],
    [
      'Multiple insert values with two columns and spread',
      sql`
        INSERT INTO table1 (
          col1,
          col2
        )
        VALUES
          $$rows(
            name,
            test
          )
        `,
      {
        rows: [
          { name: 1, test: 'c' },
          { name: 2, test: 'f' },
        ],
      },
      {
        text: `
        INSERT INTO table1 (
          col1,
          col2
        )
        VALUES
          ($1,$2),($3,$4)
        `,
        values: [1, 'c', 2, 'f'],
      },
    ],
    [
      'Multiple insert values with three columns and spread',
      sql`
        INSERT INTO table1 (
          col1,
          col2,
          col3
        )
        VALUES
          $$rows(
            name,
            test,
            other
          )
        `,
      {
        rows: [
          { name: 1, test: 'c', other: 'a' },
          { name: 2, test: 'f', other: 'z' },
        ],
      },
      {
        text: `
        INSERT INTO table1 (
          col1,
          col2,
          col3
        )
        VALUES
          ($1,$2,$3),($4,$5,$6)
        `,
        values: [1, 'c', 'a', 2, 'f', 'z'],
      },
    ],
    [
      'Two params',
      sql`SELECT * FROM table1 WHERE id = $id AND a = $test`,
      { id: 10, test: 20 },
      { text: 'SELECT * FROM table1 WHERE id = $1 AND a = $2', values: [10, 20] },
    ],
    [
      'Four params, each different',
      sql`
        SELECT *
        FROM table1
        WHERE
          id = $id AND a = $my_test_param OR other = $other_test_param OR last_col = $last_param
        `,
      { id: 10, my_test_param: 20, other_test_param: 30, last_param: 40 },
      {
        text: `
        SELECT *
        FROM table1
        WHERE
          id = $1 AND a = $2 OR other = $3 OR last_col = $4
        `,
        values: [10, 20, 30, 40],
      },
    ],
    [
      'Four params, two identical, one after the other',
      sql`SELECT * FROM table1 WHERE id = $id AND a = $id OR other = $other OR last_col = $other`,
      { id: 10, other: 20 },
      { text: 'SELECT * FROM table1 WHERE id = $1 AND a = $1 OR other = $2 OR last_col = $2', values: [10, 20] },
    ],
    [
      'Four params, two identical, intermixed',
      sql`SELECT * FROM table1 WHERE other = $other AND id = $id OR a = $id OR last_col = $other`,
      { id: 10, other: 20 },
      { text: 'SELECT * FROM table1 WHERE other = $1 AND id = $2 OR a = $2 OR last_col = $1', values: [20, 10] },
    ],
    [
      'Param like strings in string literals that should be escaped, params in select and repeating params',
      sql`
        SELECT
          'test' AS col1,
          'name :test' AS col2,
          'other name :test' AS col3,
          $example AS col4
        FROM table1
        WHERE
          id = $id AND other_col = $example
        `,
      { id: 10, example: 20 },
      {
        text: `
        SELECT
          'test' AS col1,
          'name :test' AS col2,
          'other name :test' AS col3,
          $1 AS col4
        FROM table1
        WHERE
          id = $2 AND other_col = $1
        `,
        values: [20, 10],
      },
    ],
    [
      'Should load spread for IN clause',
      sql`
        SELECT
          r.tariff_id AS "tariffId",
          r.rate,
          r.start_date_on AS "startOn",
          t.code AS "tariffCode",
          t.type AS "tariffType",
          r.end_date_on AS "endOn"
        FROM
          tariff_rates AS r
          LEFT JOIN tariffs AS t
            ON r.tariff_id = t.id
        WHERE
          start_date_on < NOW() AND (end_date_on::date IS NULL OR end_date_on > NOW()) AND t.id IN $$ids
        `,
      {
        ids: [1, 2, 3],
      },
      {
        text: `
        SELECT
          r.tariff_id AS "tariffId",
          r.rate,
          r.start_date_on AS "startOn",
          t.code AS "tariffCode",
          t.type AS "tariffType",
          r.end_date_on AS "endOn"
        FROM
          tariff_rates AS r
          LEFT JOIN tariffs AS t
            ON r.tariff_id = t.id
        WHERE
          start_date_on < NOW() AND (end_date_on::date IS NULL OR end_date_on > NOW()) AND t.id IN ($1,$2,$3)
        `,
        values: [1, 2, 3],
      },
    ],
    [
      'Should load spread for IN clause for rows',
      sql`
        SELECT
          table_schema AS "schema",
          table_name AS "table",
          column_name AS "column",
          is_nullable AS "isNullable",
          udt_name AS "recordName",
          data_type AS "dataType"
        FROM information_schema.columns
        WHERE
          (table_schema, table_name) IN ($$tables(
            schema,
            table
          ))
        `,
      {
        tables: [
          { schema: 'public', table: 'table1' },
          { schema: 'public', table: 'table2' },
          { schema: 'fit', table: 'table3' },
        ],
      },
      {
        text: `
        SELECT
          table_schema AS "schema",
          table_name AS "table",
          column_name AS "column",
          is_nullable AS "isNullable",
          udt_name AS "recordName",
          data_type AS "dataType"
        FROM information_schema.columns
        WHERE
          (table_schema, table_name) IN (($1,$2),($3,$4),($5,$6))
        `,
        values: ['public', 'table1', 'public', 'table2', 'fit', 'table3'],
      },
    ],
  ])('Should convert to query an sql with %s', (_, query, params, expected) =>
    withParserErrors(() => {
      expect(toQueryConfig(query, params)).toEqual(expected);
    }),
  );
});
