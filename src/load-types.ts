import {
  Query,
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
  RecordType,
  isArrayType,
  isRecordType,
  LiteralType,
  isUnionType,
  ArrayType,
  isConditionalType,
} from './query-interface';
import { ClientBase, QueryConfig } from 'pg';
import { diffBy, isEmpty, uniqBy } from './util';

export type LoadedUnion = { type: 'union'; items: LoadedType[] };
export type LoadedArray = { type: 'array'; items: LoadedType };
export type LoadedType = ConstantType | LoadedArray | LoadedUnion | LiteralType;

export interface LoadedResult {
  name: string;
  type: LoadedType;
}

export interface LoadedParam {
  name: string;
  type: LoadedType;
}

export interface LoadedQuery {
  params: LoadedParam[];
  result: LoadedResult[];
}

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

interface LoadContext {
  columnTypes: ColumnType[];
  starTypes: StarType[];
  functionTypes: (FunctionType | FunctionArgType)[];
  recordTypes: RecordType[];
}

interface DataContext {
  info: Info[];
  functions: Function[];
  records: Record[];
}

interface Context {
  data: DataContext;
  load: LoadContext;
}

type ToType = (type?: PropertyType | FunctionType | FunctionArgType) => LoadedType;

export const isLoadedUnionType = (type: LoadedType): type is LoadedUnion =>
  typeof type === 'object' && 'type' in type && type.type === 'union';
export const isLoadedArrayType = (type: LoadedType): type is LoadedArray =>
  typeof type === 'object' && 'type' in type && type.type === 'array';
export const isOptional = (type: LoadedType): boolean =>
  type === 'null' || (isLoadedUnionType(type) && type.items.some(isOptional));
export const typeFromOptional = (type: LoadedType): LoadedType | undefined =>
  isLoadedUnionType(type) ? type.items.filter((item) => item !== 'null')[0] : type;

const infoQuery = (columnTypes: ColumnType[], starTypes: StarType[]): QueryConfig => {
  const starTypesIndex = columnTypes.length * 3;
  return {
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
              .map((_, index) => `(\$${starTypesIndex + index * 2 + 1},\$${starTypesIndex + index * 2 + 2})`)
              .join(',')})`
      }
  `,
    values: [
      ...columnTypes.flatMap(({ schema = 'public', table, column }) => [schema, table, column]),
      ...starTypes.flatMap(({ schema = 'public', table }) => [schema, table]),
    ],
  };
};

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

const recordsQuery = (enumTypes: RecordType[], columnTypes: ColumnType[]): QueryConfig => {
  const columnTypesIndex = enumTypes.length;
  return {
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
                .map(
                  (_, index) =>
                    `(\$${columnTypesIndex + index * 3 + 1},\$${columnTypesIndex + index * 3 + 2},\$${
                      columnTypesIndex + index * 3 + 3
                    })`,
                )
                .join(',')})`
        }
      )
      AND pg_type.typcategory = 'E'
    GROUP BY pg_type.typname, pg_type.typcategory, pg_type.oid
  `,
    values: enumTypes
      .map(({ name }) => name)
      .concat(columnTypes.flatMap(({ schema = 'public', table, column }) => [schema, table, column])),
  };
};

const matchesColumnType = (columnType: ColumnType) => (info: Info): boolean =>
  columnType.column === info.column && columnType.schema === info.schema && columnType.table === info.table;

const matchesRecordType = (type: RecordType) => (record: Record): boolean => type.name === record.name;

const matchesFunctionType = (type: FunctionType, context: DataContext) => (value: Function): boolean =>
  type.name === value.name &&
  type.args.every((arg, index) => {
    const aggType = typeFromOptional(loadType(context)(arg));
    return (
      value.parametersDataType[index] === 'anyelement' ||
      (value.parametersDataType[index] === 'anyarray' && aggType && (value.isAggregate || isArrayType(aggType))) ||
      toConstantType(value.parametersDataType[index]) === aggType
    );
  });
const matchesFunctionArgType = (type: FunctionArgType) => (value: Function): boolean => type.name === value.name;
const matchesStarType = (columnType: StarType) => (info: Info): boolean =>
  columnType.schema === info.schema && columnType.table === info.table;

const mergeTypes = (dest: LoadedType, src: LoadedType): LoadedType =>
  dest !== src
    ? {
        type: 'union',
        items: [...(isUnionType(dest) ? dest.items : [dest]), ...(isUnionType(src) ? src.items : [src])],
      }
    : dest;

const loadType = (context: DataContext): ToType => (type) => {
  const recur = loadType(context);
  const loadConstantType = (constantType: ConstantType | ArrayType) =>
    isArrayType(constantType) ? recur(constantType) : constantType;

  if (type === undefined) {
    return 'unknown';
  } else if (isColumnType(type)) {
    const columType = context.info?.find(matchesColumnType(type));
    return columType?.dataType === 'USER-DEFINED'
      ? recur({ type: 'record', name: columType.recordName })
      : columType?.isNullable
      ? { type: 'union', items: ['null', loadConstantType(toConstantType(columType?.dataType))] }
      : loadConstantType(toConstantType(columType?.dataType));
  } else if (isRecordType(type)) {
    return {
      type: 'union',
      items: context.records?.find(matchesRecordType(type))?.enum.map((value) => ({ type: 'literal', value })) ?? [],
    };
  } else if (isArrayType(type)) {
    return { type: 'array', items: recur(type.items) };
  } else if (isUnionType(type)) {
    return type.items.map(recur).reduce(mergeTypes);
  } else if (isConditionalType(type)) {
    const coalesceTypes = type.items.map(recur);
    return coalesceTypes.some(isOptional) ? { type: 'union', items: ['null', coalesceTypes[0]] } : coalesceTypes[0];
  } else if (isFunctionType(type)) {
    switch (type.name) {
      case 'array_agg':
        return { type: 'array', items: recur(type.args[0]) };
      case 'max':
      case 'min':
        return recur(type.args[0]);
      default:
        return loadConstantType(toConstantType(context.functions?.find(matchesFunctionType(type, context))?.dataType));
    }
  } else if (isFunctionArgType(type)) {
    return loadConstantType(
      toConstantType(context.functions?.find(matchesFunctionArgType(type))?.parametersDataType[type.index]),
    );
  } else {
    return type;
  }
};

const toColumnType = (type: PropertyType | FunctionType | FunctionArgType | StarType): ColumnType[] =>
  isColumnType(type) ? [type] : isFunctionType(type) ? type.args.flatMap(toColumnType) : [];
const toRecordType = (type: PropertyType | FunctionType | FunctionArgType | StarType): RecordType[] =>
  isRecordType(type) ? [type] : [];
const toFunctionType = (
  type: PropertyType | FunctionType | FunctionArgType | StarType,
): (FunctionType | FunctionArgType)[] =>
  isFunctionType(type) ? [type, ...type.args.flatMap(toFunctionType)] : isFunctionArgType(type) ? [type] : [];

const diffLoadContext = (base: LoadContext, load: LoadContext): LoadContext => ({
  columnTypes: diffBy((item) => `${item.schema}.${item.table}.${item.column}`, load.columnTypes, base.columnTypes),
  starTypes: diffBy((item) => `${item.schema}.${item.table}`, load.starTypes, base.starTypes),
  functionTypes: diffBy((item) => item.name, load.functionTypes, base.functionTypes),
  recordTypes: diffBy((item) => item.name, load.recordTypes, base.recordTypes),
});

const mergeLoadContext = (from: LoadContext, to: LoadContext): LoadContext => ({
  columnTypes: uniqBy((item) => `${item.schema}.${item.table}.${item.column}`, from.columnTypes.concat(to.columnTypes)),
  starTypes: uniqBy((item) => `${item.schema}.${item.table}`, from.starTypes.concat(to.starTypes)),
  functionTypes: uniqBy((item) => item.name, from.functionTypes.concat(to.functionTypes)),
  recordTypes: uniqBy((item) => item.name, from.recordTypes.concat(to.recordTypes)),
});

const mergeContext = (dst: Context, src: Context): Context => ({
  data: {
    info: dst.data.info.concat(src.data.info),
    functions: dst.data.functions.concat(src.data.functions),
    records: dst.data.records.concat(src.data.records),
  },
  load: {
    columnTypes: dst.load.columnTypes.concat(src.load.columnTypes),
    starTypes: dst.load.starTypes.concat(src.load.starTypes),
    functionTypes: dst.load.functionTypes.concat(src.load.functionTypes),
    recordTypes: dst.load.recordTypes.concat(src.load.recordTypes),
  },
});

const toLoadContext = ({ params, result }: Query): LoadContext => {
  const types = [...params.map((item) => item.type), ...result.map((item) => item.type)];
  return {
    columnTypes: types.flatMap(toColumnType),
    starTypes: types.filter(isStarType),
    functionTypes: types.flatMap(toFunctionType),
    recordTypes: types.flatMap(toRecordType),
  };
};

const toDataContext = async (
  db: ClientBase,
  { columnTypes, starTypes, functionTypes, recordTypes }: LoadContext,
): Promise<DataContext> => {
  const [{ rows: info }, { rows: functions }, { rows: records }] = await Promise.all<
    { rows: Info[] },
    { rows: Function[] },
    { rows: Record[] }
  >([
    columnTypes.length || starTypes.length ? db.query<Info>(infoQuery(columnTypes, starTypes)) : { rows: [] },
    functionTypes.length ? db.query<Function>(functionsQuery(functionTypes)) : { rows: [] },
    recordTypes.length || columnTypes.length ? db.query<Record>(recordsQuery(recordTypes, columnTypes)) : { rows: [] },
  ]);
  return { info, functions, records };
};

const toLoadedQuery = (data: DataContext, query: Query): LoadedQuery => {
  const toType = loadType(data);

  return {
    params: query.params.map((item) => ({ ...item, type: toType(item.type) })),
    result: query.result.flatMap((item) => {
      const type = item.type;
      if (isStarType(type)) {
        return data.info
          .filter(matchesStarType(type))
          .map((info) => ({ name: info.column, type: toType(toConstantType(info.dataType)) }));
      } else {
        return { ...item, type: toType(type) };
      }
    }),
  };
};

const defaultContext: Context = {
  load: { columnTypes: [], starTypes: [], functionTypes: [], recordTypes: [] },
  data: { info: [], functions: [], records: [] },
};

export const loadQuery = async (
  db: ClientBase,
  query: Query,
  base: Context = defaultContext,
): Promise<{ context: Context; query: LoadedQuery }> => {
  const load = diffLoadContext(base.load, toLoadContext(query));
  const data = await toDataContext(db, load);
  const context = mergeContext(base, { load, data });
  return { context, query: toLoadedQuery(context.data, query) };
};

export const loadQueries = async (
  db: ClientBase,
  queries: Query[],
  base: Context = defaultContext,
): Promise<{ context: Context; queries: LoadedQuery[] }> => {
  const load = diffLoadContext(
    base.load,
    queries.reduce((all, query) => mergeLoadContext(all, toLoadContext(query)), defaultContext.load),
  );
  const data = await toDataContext(db, load);
  const context = mergeContext(base, { load, data });
  return { context, queries: queries.map((query) => toLoadedQuery(context.data, query)) };
};
