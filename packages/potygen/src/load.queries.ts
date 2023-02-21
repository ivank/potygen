/**
 * load.query.ts
 *
 * All the actual sql queries used to load type data from postgres
 * Used by [load.ts](./load.ts).
 */

import { sql } from './sql';
import { LoadedDataRaw, QualifiedName } from './load.types';

/**
 * We construct the data by hand as potygen can't effectively load types from information_schema views
 */
interface LoadAllSql {
  params: {};
  result: LoadedDataRaw[];
}

/**
 * We construct the data by hand as potygen can't effectively load types from information_schema views
 */
interface LoadSql {
  params: {
    tableNames: QualifiedName[];
    compositeNames: QualifiedName[];
    enumNames: QualifiedName[];
    functionNames: QualifiedName[];
  };
  result: LoadedDataRaw[];
}

/**
 * A query to load {@link LoadedDataRaw} data for all the possible data points in the database.
 *
 * - Functions
 * - Enums
 * - Composites
 * - Tables
 */
export const allSql = sql<LoadAllSql>`
  SELECT
    'Composite' AS "type",
    json_build_object('schema', attributes.udt_schema, 'name', attributes.udt_name) AS "name",
    obj_description((attributes.udt_schema || '.' || attributes.udt_name)::regclass) AS "comment",
    json_agg(
      json_build_object(
        'name', attributes.attribute_name,
        'isNullable', attributes.is_nullable,
        'record', attributes.attribute_udt_name,
        'type', attributes.data_type
      )
      ORDER BY
        attributes.ordinal_position ASC
    ) AS "data"
  FROM
    information_schema.attributes
    LEFT JOIN information_schema.columns
      ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = attributes.udt_name
  GROUP BY
    attributes.udt_schema,
    attributes.udt_name

  UNION ALL

  SELECT
    'Table' AS "type",
    json_build_object('schema', table_schema, 'name', table_name) AS "name",
    obj_description((table_schema || '.' || table_name)::regclass) AS "comment",
    json_agg(
      json_build_object(
        'name', column_name,
        'isNullable', is_nullable,
        'record', udt_name,
        'type', data_type,
        'comment', COL_DESCRIPTION(CONCAT_WS('.', table_schema, table_name)::regclass, columns.ordinal_position),
        'generation_expression',
        CASE
        EXISTS (
          SELECT TRUE
          FROM information_schema.columns AS schema_columns
          WHERE
            schema_columns.table_schema = 'information_schema' AND schema_columns.column_name = 'generation_expression'
            AND schema_columns.table_name = 'columns'
        )
          WHEN TRUE THEN columns.generation_expression
          ELSE NULL
        END
      )
      ORDER BY
        columns.ordinal_position ASC
    ) AS "data"
  FROM information_schema.columns
  WHERE
    table_schema != 'information_schema' AND table_schema != 'pg_catalog'
  GROUP BY
    columns.table_schema,
    columns.table_name

  UNION ALL

  SELECT
    'View' AS "type",
    json_build_object('schema', views.table_schema, 'name', views.table_name) AS "name",
    obj_description((views.table_schema || '.' || views.table_name)::regclass) AS "comment",
    to_json(COALESCE(view_definition, '')) AS "data"
  FROM information_schema.views
  WHERE
    view_definition IS NOT NULL AND views.table_schema != 'pg_catalog' AND views.table_schema != 'information_schema'

  UNION ALL

  SELECT
    'Enum' AS "type",
    json_build_object('schema', columns.table_schema, 'name', pg_type.typname) AS "name",
    obj_description(pg_type.oid, 'pg_type') AS "comment",
    to_json(JSONB_AGG(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder)) AS "data"
  FROM
    pg_catalog.pg_type
    JOIN pg_catalog.pg_enum
      ON pg_enum.enumtypid = pg_type.oid
    LEFT JOIN information_schema.columns
      ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = pg_catalog.pg_type.typname
  WHERE
    pg_type.typcategory = 'E'
  GROUP BY
    columns.table_schema,
    pg_type.typname,
    pg_type.typcategory,
    pg_type.oid

  UNION ALL

  SELECT
    'Function' AS "type",
    json_build_object('schema', routines.routine_schema, 'name', routines.routine_name) AS "name",
    obj_description(
      (SELECT pg_proc.oid FROM pg_catalog.pg_proc WHERE pg_proc.proname = routines.routine_name LIMIT 1),
      'pg_proc'
    ) AS "comment",
    json_build_object(
      'returnType', routines.data_type,
      'isAggregate', routines.routine_definition = 'aggregate_dummy',
      'argTypes', JSONB_AGG(COALESCE(parameters.data_type, 'null') ORDER BY parameters.ordinal_position ASC)
    ) AS "data"
  FROM
    information_schema.routines
    LEFT JOIN information_schema.parameters
      ON parameters.specific_name = routines.specific_name
  GROUP BY
    routines.routine_schema,
    routines.routine_name,
    routines.data_type,
    routines.specific_name,
    routines.routine_definition
  `;

/**
 * A query to load {@link LoadedDataRaw} data only for specific {@link Data}
 *
 * - Functions
 * - Enums
 * - Composites
 * - Tables
 */
export const selectedSql = sql<LoadSql>`
  WITH
    table_names ("schema", "name") AS
    (
      VALUES
        $$tableNames(
          schema,
          name
        )
    ),
    composite_names ("schema", "name") AS
    (
      VALUES
        $$compositeNames(
          schema,
          name
        )
    ),
    enum_names ("schema", "name") AS
    (
      VALUES
        $$enumNames(
          schema,
          name
        )
    ),
    function_names ("schema", "name") AS
    (
      VALUES
        $$functionNames(
          schema,
          name
        )
    )
  SELECT
    'Composite' AS "type",
    json_build_object('schema', attributes.udt_schema, 'name', attributes.udt_name) AS "name",
    obj_description((attributes.udt_schema || '.' || attributes.udt_name)::regclass) AS "comment",
    json_agg(
      json_build_object(
        'name', attributes.attribute_name,
        'isNullable', attributes.is_nullable,
        'type', attributes.data_type
      )
      ORDER BY
        attributes.ordinal_position ASC
    ) AS "data"
  FROM
    information_schema.attributes
    LEFT JOIN information_schema.columns
      ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = attributes.udt_name
    JOIN table_names
      ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
      AND table_names."name" = table_name
  GROUP BY
    attributes.udt_schema,
    attributes.udt_name

  UNION ALL

  SELECT
    'Table' AS "type",
    json_build_object('schema', table_schema, 'name', table_name) AS "name",
    obj_description((table_schema || '.' || table_name)::regclass) AS "comment",
    json_agg(
      json_build_object(
        'name', column_name,
        'isNullable', is_nullable,
        'record', udt_name,
        'type', data_type,
        'comment', COL_DESCRIPTION(CONCAT_WS('.', table_schema, table_name)::regclass, columns.ordinal_position),
        'generation_expression',
        CASE
        EXISTS (
          SELECT TRUE
          FROM information_schema.columns AS schema_columns
          WHERE
            schema_columns.table_schema = 'information_schema' AND schema_columns.column_name = 'generation_expression'
            AND schema_columns.table_name = 'columns'
        )
          WHEN TRUE THEN columns.generation_expression
          ELSE NULL
        END
      )
      ORDER BY
        columns.ordinal_position ASC
    ) AS "data"
  FROM
    information_schema.columns
    JOIN table_names
      ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
      AND table_names."name" = table_name
  GROUP BY
    columns.table_schema,
    columns.table_name

  UNION ALL

  SELECT
    'View' AS "type",
    json_build_object('schema', views.table_schema, 'name', views.table_name) AS "name",
    obj_description((views.table_schema || '.' || views.table_name)::regclass) AS "comment",
    to_json(COALESCE(view_definition, '')) AS "data"
  FROM
    information_schema.views
    JOIN table_names
      ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
      AND table_names."name" = table_name
  WHERE
    view_definition IS NOT NULL

  UNION ALL

  SELECT
    'Composite' AS "type",
    json_build_object('schema', udt_schema, 'name', udt_name) AS "name",
    obj_description((udt_schema || '.' || udt_name)::regclass) AS "comment",
    json_agg(
      json_build_object('name', attribute_name, 'isNullable', is_nullable, 'type', data_type)
      ORDER BY
        ordinal_position ASC
    ) AS "data"
  FROM
    information_schema.attributes
    JOIN composite_names
      ON CASE composite_names."schema" WHEN '_' THEN TRUE ELSE composite_names."schema" = udt_schema END
      AND composite_names."name" = udt_name
  GROUP BY
    udt_schema,
    udt_name

  UNION ALL

  SELECT
    'Enum' AS "type",
    json_build_object('schema', columns.table_schema, 'name', pg_type.typname) AS "name",
    obj_description(pg_type.oid, 'pg_type') AS "comment",
    to_json(JSONB_AGG(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder)) AS "data"
  FROM
    pg_catalog.pg_type
    JOIN pg_catalog.pg_enum
      ON pg_enum.enumtypid = pg_type.oid
    LEFT JOIN information_schema.columns
      ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = pg_catalog.pg_type.typname
    JOIN table_names
      ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
      AND table_names."name" = table_name
  WHERE
    pg_type.typcategory = 'E'
  GROUP BY
    columns.table_schema,
    pg_type.typname,
    pg_type.typcategory,
    pg_type.oid

  UNION ALL

  SELECT
    'Enum' AS "type",
    json_build_object('schema', pg_namespace.nspname, 'name', pg_type.typname) AS "name",
    obj_description(pg_type.oid, 'pg_type') AS "comment",
    to_json(JSONB_AGG(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder ASC)) AS "data"
  FROM
    pg_catalog.pg_type
    JOIN pg_catalog.pg_enum
      ON pg_enum.enumtypid = pg_type.oid
    LEFT JOIN information_schema.columns
      ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = pg_catalog.pg_type.typname
    JOIN pg_catalog.pg_namespace
      ON pg_type.typnamespace = pg_namespace.oid
    JOIN enum_names
      ON CASE enum_names."schema" WHEN '_' THEN TRUE ELSE enum_names."schema" = pg_namespace.nspname END
      AND enum_names."name" = pg_type.typname
  WHERE
    pg_type.typcategory = 'E'
  GROUP BY
    pg_namespace.nspname,
    pg_type.typname,
    pg_type.typcategory,
    pg_type.oid

  UNION ALL

  SELECT
    'Function' AS "type",
    json_build_object('schema', routines.routine_schema, 'name', routines.routine_name) AS "name",
    obj_description(
      (SELECT pg_proc.oid FROM pg_catalog.pg_proc WHERE pg_proc.proname = routines.routine_name LIMIT 1),
      'pg_proc'
    ) AS "comment",
    json_build_object(
      'returnType', routines.data_type,
      'isAggregate', routines.routine_definition = 'aggregate_dummy',
      'argTypes', JSONB_AGG(parameters.data_type ORDER BY parameters.ordinal_position ASC)
    ) AS "data"
  FROM
    information_schema.routines
    LEFT JOIN information_schema.parameters
      ON parameters.specific_name = routines.specific_name
    JOIN function_names
      ON CASE function_names."schema" WHEN '_' THEN TRUE ELSE function_names."schema" = routine_schema END
      AND function_names."name" = routine_name
  GROUP BY
    routines.routine_schema,
    routines.routine_name,
    routines.data_type,
    routines.specific_name,
    routines.routine_definition
  `;
