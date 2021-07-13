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

interface Info {
  schema: string;
  table: string;
  column: string;
  isNullable: 'YES' | 'NO';
  dataType: string;
}

interface Function {
  schema: string;
  name: string;
  dataType: string;
  isAggregate: boolean;
  parametersDataType: string[];
}

interface Context {
  info: Info[];
  functions: Function[];
}

type ToType = (
  type: PropertyType | FunctionType | FunctionArgType,
) => ConstantType | ArrayType | RecordType | UnionType;

const matchesColumnType = (columnType: ColumnType) => (info: Info): boolean =>
  columnType.column.toLowerCase() === info.column &&
  columnType.schema.toLowerCase() === info.schema &&
  columnType.table.toLowerCase() === info.table;

const matchesFunctionType = (type: FunctionType, context: Context) => (value: Function): boolean =>
  type.name.toLowerCase() === value.name &&
  type.args.every(
    (arg, index) =>
      value.parametersDataType[index] === 'anyelement' ||
      (value.parametersDataType[index] === 'anyarray' && value.isAggregate) ||
      toConstantType(value.parametersDataType[index]) === loadType(context)(arg),
  );
const matchesFunctionArgType = (type: FunctionArgType) => (value: Function): boolean =>
  type.name.toLowerCase() === value.name;
const matchesStarType = (columnType: StarType) => (info: Info): boolean =>
  columnType.schema.toLowerCase() === info.schema && columnType.table.toLowerCase() === info.table;

export const loadType = (context: Context): ToType => (type) => {
  if (isColumnType(type)) {
    return toConstantType(context.info.find(matchesColumnType(type))?.dataType);
  } else if (isFunctionType(type)) {
    return toConstantType(context.functions.find(matchesFunctionType(type, context))?.dataType);
  } else if (isFunctionArgType(type)) {
    return toConstantType(context.functions.find(matchesFunctionArgType(type))?.parametersDataType[type.index]);
  } else {
    return type;
  }
};

export const toColumnType = (type: PropertyType | FunctionType | FunctionArgType | StarType): ColumnType[] =>
  isColumnType(type) ? [type] : isFunctionType(type) ? type.args.flatMap(toColumnType) : [];
export const toFunctionType = (
  type: PropertyType | FunctionType | FunctionArgType | StarType,
): (FunctionType | FunctionArgType)[] =>
  isFunctionType(type) ? [type, ...type.args.flatMap(toFunctionType)] : isFunctionArgType(type) ? [type] : [];

export const loadTypes = async (db: ClientBase, { params, result }: QueryInterface): Promise<QueryInterface> => {
  const types = [...params.map((item) => item.type), ...result.map((item) => item.type)];

  const columnTypes = types.flatMap(toColumnType);
  const starTypes = types.filter(isStarType);
  const functionTypes = types.flatMap(toFunctionType);

  try {
    const info =
      columnTypes.length || starTypes.length ? (await db.query<Info>(infoQuery(columnTypes, starTypes))).rows : [];

    const functions = functionTypes.length ? (await db.query<Function>(functionsQuery(functionTypes))).rows : [];
    const toType = loadType({ info, functions });

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
