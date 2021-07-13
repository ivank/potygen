import {
  QueryInterface,
  isColumnType,
  ColumnType,
  StarType,
  isStarType,
  toConstantType,
  isFunctionType,
  FunctionType,
  FunctionArgType,
  isFunctionArgType,
  PropertyType,
  ConstantType,
  ArrayType,
  RecordType,
  UnionType,
  isArrayType,
  isRecordType,
  LiteralType,
} from './query-interface';
import { ClientBase, QueryConfig } from 'pg';
import { isEmpty } from './util';
// import { inspect } from 'util';

const infoQuery = (columnTypes: ColumnType[], starTypes: StarType[]): QueryConfig => ({
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
      ${
        isEmpty(columnTypes)
          ? 'FALSE'
          : `(table_schema, table_name, column_name) IN (${columnTypes
              .map((_, index) => `(\$${index * 3 + 1},\$${index * 3 + 2},\$${index * 3 + 3})`)
              .join(',')})`
      }
      OR
      ${
        isEmpty(starTypes)
          ? 'FALSE'
          : `(table_schema, table_name) IN (${starTypes
              .map((_, index) => `(\$${index * 2 + 1},\$${index * 2 + 2})`)
              .join(',')})`
      }
  `,
  values: [
    ...columnTypes.flatMap(({ schema = 'public', table, column }) => [schema, table, column]),
    ...starTypes.flatMap(({ schema = 'public', table }) => [schema, table]),
  ],
});

const functionsQuery = (functionTypes: (FunctionType | FunctionArgType)[]): QueryConfig => ({
  text: `
    SELECT
      routines.routine_schema AS "schema",
      routines.routine_name AS "name",
      routines.data_type AS "dataType",
      routines.routine_definition = 'aggregate_dummy' AS "isAggregate",
      JSONB_AGG(parameters.data_type ORDER BY parameters.ordinal_position ASC) AS "parametersDataType"
    FROM information_schema.routines
    LEFT JOIN information_schema.parameters ON parameters.specific_name = routines.specific_name
    WHERE
      routine_name IN (${functionTypes.map((_, index) => `LOWER(\$${index + 1})`).join(',')})
    GROUP BY (routines.routine_schema, routines.routine_name, routines.data_type, routines.specific_name, routines.routine_definition)
  `,
  values: functionTypes.map(({ name }) => name),
});

const recordsQuery = (enumTypes: RecordType[], columnTypes: ColumnType[]): QueryConfig => ({
  text: `
    SELECT
      pg_type.typname as "name",
      JSONB_AGG(pg_enum.enumlabel) as "enum"
    FROM pg_catalog.pg_type
    JOIN pg_catalog.pg_enum ON pg_enum.enumtypid = pg_type.oid
    LEFT JOIN information_schema.columns ON columns.data_type = 'USER-DEFINED' AND columns.udt_name = pg_catalog.pg_type.typname
    WHERE
      (
        ${
          isEmpty(enumTypes)
            ? `FALSE`
            : `pg_type.typname IN (${enumTypes.map((_, index) => `LOWER(\$${index + 1})`).join(',')})`
        }
        OR
        ${
          isEmpty(columnTypes)
            ? 'FALSE'
            : `(table_schema, table_name, column_name) IN (${columnTypes
                .map((_, index) => `(\$${index * 3 + 1},\$${index * 3 + 2},\$${index * 3 + 3})`)
                .join(',')})`
        }
      )
      AND pg_type.typcategory = 'E'
    GROUP BY pg_type.typname, pg_type.typcategory, pg_type.oid
  `,
  values: enumTypes
    .map(({ name }) => name)
    .concat(columnTypes.flatMap(({ schema = 'public', table, column }) => [schema, table, column])),
});

interface Info {
  schema: string;
  table: string;
  column: string;
  isNullable: 'YES' | 'NO';
  recordName: string;
  dataType: string;
}

interface Function {
  schema: string;
  name: string;
  dataType: string;
  isAggregate: boolean;
  parametersDataType: string[];
}

interface Record {
  name: string;
  enum: string[];
}

interface Context {
  info: Info[];
  functions: Function[];
  records: Record[];
}

type ToType = (
  type?: PropertyType | FunctionType | FunctionArgType,
) => ConstantType | ArrayType | RecordType | UnionType | LiteralType;

const matchesColumnType = (columnType: ColumnType) => (info: Info): boolean =>
  columnType.column === info.column && columnType.schema === info.schema && columnType.table === info.table;

const matchesRecordType = (type: RecordType) => (record: Record): boolean => type.name === record.name;

const matchesFunctionType = (type: FunctionType, context: Context) => (value: Function): boolean =>
  type.name === value.name &&
  type.args.every((arg, index) => {
    const aggType = loadType(context)(arg);
    return (
      value.parametersDataType[index] === 'anyelement' ||
      (value.parametersDataType[index] === 'anyarray' && (value.isAggregate || isArrayType(aggType))) ||
      toConstantType(value.parametersDataType[index]) === aggType
    );
  });
const matchesFunctionArgType = (type: FunctionArgType) => (value: Function): boolean => type.name === value.name;
const matchesStarType = (columnType: StarType) => (info: Info): boolean =>
  columnType.schema === info.schema && columnType.table === info.table;

export const loadType = (context: Context): ToType => (type) => {
  if (type === undefined) {
    return 'unknown';
  } else if (isColumnType(type)) {
    const columType = context.info.find(matchesColumnType(type));
    return columType?.dataType === 'USER-DEFINED'
      ? loadType(context)({ type: 'record', name: columType.recordName })
      : toConstantType(columType?.dataType);
  } else if (isRecordType(type)) {
    return {
      type: 'union',
      items: context.records.find(matchesRecordType(type))?.enum.map((value) => ({ type: 'literal', value })) ?? [],
    };
  } else if (isFunctionType(type)) {
    switch (type.name) {
      case 'array_agg':
        return { type: 'array', items: loadType(context)(type.args[0]) };
      case 'max':
      case 'min':
        return loadType(context)(type.args[0]);
      default:
        return toConstantType(context.functions.find(matchesFunctionType(type, context))?.dataType);
    }
  } else if (isFunctionArgType(type)) {
    return toConstantType(context.functions.find(matchesFunctionArgType(type))?.parametersDataType[type.index]);
  } else {
    return type;
  }
};

export const toColumnType = (type: PropertyType | FunctionType | FunctionArgType | StarType): ColumnType[] =>
  isColumnType(type) ? [type] : isFunctionType(type) ? type.args.flatMap(toColumnType) : [];
export const toRecordType = (type: PropertyType | FunctionType | FunctionArgType | StarType): RecordType[] =>
  isRecordType(type) ? [type] : [];
export const toFunctionType = (
  type: PropertyType | FunctionType | FunctionArgType | StarType,
): (FunctionType | FunctionArgType)[] =>
  isFunctionType(type) ? [type, ...type.args.flatMap(toFunctionType)] : isFunctionArgType(type) ? [type] : [];

export const loadTypes = async (db: ClientBase, { params, result }: QueryInterface): Promise<QueryInterface> => {
  const types = [...params.map((item) => item.type), ...result.map((item) => item.type)];

  const columnTypes = types.flatMap(toColumnType);
  const starTypes = types.filter(isStarType);
  const functionTypes = types.flatMap(toFunctionType);
  const recordTypes = types.flatMap(toRecordType);

  try {
    const info =
      columnTypes.length || starTypes.length ? (await db.query<Info>(infoQuery(columnTypes, starTypes))).rows : [];
    const functions = functionTypes.length ? (await db.query<Function>(functionsQuery(functionTypes))).rows : [];
    const records =
      recordTypes.length || columnTypes.length
        ? (await db.query<Record>(recordsQuery(recordTypes, columnTypes))).rows
        : [];

    const toType = loadType({ info, functions, records });

    return {
      params: params.map((item) => ({ ...item, type: toType(item.type) })),
      result: result.flatMap((item) => {
        const type = item.type;
        if (isStarType(type)) {
          return info
            .filter(matchesStarType(type))
            .map((info) => ({ name: info.column, type: toConstantType(info.dataType) }));
        } else {
          return { ...item, type: toType(type) };
        }
      }),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
