SELECT
  'Table' AS "type",
  json_build_object('schema', table_schema, 'name', table_name) AS "name",
  json_agg(
    json_build_object('name', column_name, 'isNullable', is_nullable, 'enum', udt_name, 'type', data_type)
    ORDER BY columns.ordinal_position ASC
  ) AS "columns"
FROM information_schema.columns
WHERE (table_schema, table_name) IN ($$tableNames(schema, name))
GROUP BY columns.table_schema, columns.table_name
