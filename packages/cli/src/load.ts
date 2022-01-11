import { isEqual, groupBy, isNil, parser, isEmpty, isUniqueBy } from '@potygen/ast';
import {
  isTypeEqual,
  QueryInterface,
  Source,
  sql,
  toPgType,
  Type,
  TypeConstant,
  toContantBinaryOperatorVariant,
  isTypeNullable,
  isTypeArrayConstant,
  isTypeLoadStar,
  TypeUnionConstant,
  TypeLoadColumn,
  Param,
  isTypeCompositeConstant,
  TypeCompositeConstant,
  toQueryInterface,
} from '@potygen/query';
import {
  isDataTable,
  isDataFunction,
  isDataEnum,
  isLoadedDataTable,
  isLoadedDataEnum,
  isLoadedDataFunction,
  isLoadedDataView,
  isLoadedDataComposite,
} from './guards';
import { LoadError } from './errors';
import {
  LoadedDataEnum,
  LoadedDataFunction,
  Data,
  LoadedData,
  DataTable,
  LoadedQueryInterface,
  LoadedFunction,
  LoadedSource,
  LoadedContext,
  LoadedParam,
  LoadedDataTable,
  LoadedDataComposite,
  DataViewRaw,
  LoadContext,
  QualifiedName,
} from './types';
import { inspect } from 'util';

interface LoadAllSql {
  params: {
    tableNames: QualifiedName[];
    compositeNames: QualifiedName[];
    enumNames: QualifiedName[];
    functionNames: QualifiedName[];
  };
  result: LoadedDataComposite | LoadedDataTable | DataViewRaw | LoadedDataEnum | LoadedDataFunction;
}

export const isDataViewRaw = (item: LoadAllSql['result']): item is DataViewRaw => item.type === 'View';
export const isNotDataViewRaw = (
  item: LoadAllSql['result'],
): item is LoadedDataComposite | LoadedDataTable | LoadedDataEnum | LoadedDataFunction => item.type !== 'View';

const allSql = sql<LoadAllSql>`
  WITH
    table_names ("schema", "name") AS (VALUES $$tableNames(schema, name)),
    composite_names ("schema", "name") AS (VALUES $$compositeNames(schema, name)),
    enum_names ("schema", "name") AS (VALUES $$enumNames(schema, name)),
    function_names ("schema", "name") AS (VALUES $$functionNames(schema, name))

  SELECT
    'Composite' AS "type",
    json_build_object('schema', attributes.udt_schema, 'name', attributes.udt_name) AS "name",
    json_agg(
      json_build_object(
        'name', attributes.attribute_name,
        'isNullable', attributes.is_nullable,
        'type', attributes.data_type
      )
      ORDER BY attributes.ordinal_position ASC
    ) AS "data"
  FROM information_schema.attributes
  LEFT JOIN information_schema.columns
    ON columns.data_type = 'USER-DEFINED'
    AND columns.udt_name = attributes.udt_name
  JOIN table_names
    ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
    AND table_names."name" = table_name
  GROUP BY attributes.udt_schema, attributes.udt_name

  UNION ALL

  SELECT
    'Table' AS "type",
    json_build_object('schema', table_schema, 'name', table_name) AS "name",
    json_agg(
      json_build_object(
        'name', column_name,
        'isNullable', is_nullable,
        'record', udt_name,
        'type', data_type,
        'comment', COL_DESCRIPTION(CONCAT_WS('.', table_schema, table_name)::regclass, columns.ordinal_position)
      )
      ORDER BY columns.ordinal_position ASC
    ) AS "data"
  FROM information_schema.columns
  JOIN table_names
    ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
    AND table_names."name" = table_name
  GROUP BY columns.table_schema, columns.table_name

  UNION ALL

  SELECT
    'View' AS "type",
    json_build_object('schema', views.table_schema, 'name', views.table_name) AS "name",
    to_json(COALESCE(view_definition, '')) as "data"
  FROM information_schema.views
  JOIN table_names
    ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
    AND table_names."name" = table_name
  WHERE view_definition IS NOT NULL

  UNION ALL

  SELECT
    'Composite' AS "type",
    json_build_object('schema', udt_schema, 'name', udt_name) AS "name",
    json_agg(
      json_build_object(
        'name', attribute_name,
        'isNullable', is_nullable,
        'type', data_type
      )
      ORDER BY ordinal_position ASC
    ) AS "data"
  FROM information_schema.attributes
  JOIN composite_names
    ON CASE composite_names."schema" WHEN '_' THEN TRUE ELSE composite_names."schema" = udt_schema END
    AND composite_names."name" = udt_name
  GROUP BY udt_schema, udt_name

  UNION ALL

  SELECT
    'Enum' AS "type",
    json_build_object('schema', columns.table_schema, 'name', pg_type.typname) AS "name",
    to_json(JSONB_AGG(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder)) as "data"
  FROM pg_catalog.pg_type
  JOIN pg_catalog.pg_enum ON pg_enum.enumtypid = pg_type.oid
  LEFT JOIN information_schema.columns
    ON columns.data_type = 'USER-DEFINED'
    AND columns.udt_name = pg_catalog.pg_type.typname
  JOIN table_names
    ON CASE table_names."schema" WHEN '_' THEN TRUE ELSE table_names."schema" = table_schema END
    AND table_names."name" = table_name
  WHERE pg_type.typcategory = 'E'
  GROUP BY (
    columns.table_schema,
    pg_type.typname,
    pg_type.typcategory,
    pg_type.oid
  )

  UNION ALL

  SELECT
    'Enum' AS "type",
    json_build_object('schema', pg_namespace.nspname, 'name', pg_type.typname) AS "name",
    to_json(JSONB_AGG(pg_enum.enumlabel ORDER BY pg_enum.enumsortorder ASC)) as "data"
  FROM pg_catalog.pg_type
  JOIN pg_catalog.pg_enum ON pg_enum.enumtypid = pg_type.oid
  LEFT JOIN information_schema.columns
    ON columns.data_type = 'USER-DEFINED'
    AND columns.udt_name = pg_catalog.pg_type.typname
  JOIN pg_catalog.pg_namespace ON pg_type.typnamespace = pg_namespace.oid
  JOIN enum_names
    ON CASE enum_names."schema" WHEN '_' THEN TRUE ELSE enum_names."schema" = pg_namespace.nspname END
    AND enum_names."name" = pg_type.typname
  WHERE pg_type.typcategory = 'E'
  GROUP BY pg_namespace.nspname, pg_type.typname, pg_type.typcategory, pg_type.oid

  UNION ALL

  SELECT
    'Function' AS "type",
    json_build_object('schema', routines.routine_schema, 'name', routines.routine_name) AS "name",
    json_build_object(
      'returnType', routines.data_type,
      'isAggregate', routines.routine_definition = 'aggregate_dummy',
      'argTypes', JSONB_AGG(parameters.data_type ORDER BY parameters.ordinal_position ASC)
    ) AS "data"
  FROM information_schema.routines
  LEFT JOIN information_schema.parameters ON parameters.specific_name = routines.specific_name
  JOIN function_names
    ON CASE function_names."schema" WHEN '_' THEN TRUE ELSE function_names."schema" = routine_schema END
    AND function_names."name" = routine_name
  GROUP BY (
    routines.routine_schema,
    routines.routine_name,
    routines.data_type,
    routines.specific_name,
    routines.routine_definition
  )
`;

const orEmptyNameList = (names: QualifiedName[]): QualifiedName[] =>
  names.length === 0 ? [{ name: '_', schema: '_' }] : names;

export const loadData = async (ctx: LoadContext, currentData: LoadedData[], newData: Data[]): Promise<LoadedData[]> => {
  const data = newData.filter(notLoaded(currentData)).filter(isUniqueBy());
  const tableNames = data.filter(isDataTable).map(({ name }) => name);
  const functionNames = data.filter(isDataFunction).map(({ name }) => name);
  const enumNames = data.filter(isDataEnum).map(({ name }) => name);
  const compositeNames = data.filter(isDataEnum).map(({ name }) => name);

  if (isEmpty(tableNames) && isEmpty(enumNames) && isEmpty(compositeNames) && isEmpty(functionNames)) {
    ctx.logger.debug('No additional data found, skipping');
    return currentData;
  }

  ctx.logger.debug(
    `Load additional data: ${data.length}. ${inspect({
      tableNames: tableNames.map(formatTableName),
      functionNames: functionNames.map(formatTableName),
      enumNames: enumNames.map(formatTableName),
      compositeNames: compositeNames.map(formatTableName),
    })}`,
  );

  const loaded = await allSql.run(ctx.db, {
    tableNames: orEmptyNameList(tableNames),
    functionNames: orEmptyNameList(functionNames),
    enumNames: orEmptyNameList(enumNames),
    compositeNames: orEmptyNameList(compositeNames),
  });

  const loadedData = loaded.filter(isNotDataViewRaw);

  const parsedViews = loaded
    .filter(isDataViewRaw)
    .map((view) => ({ ...view, queryInterface: toQueryInterface(parser(view.data).ast) }));

  if (parsedViews.length) {
    ctx.logger.debug(`Load views: ${parsedViews.map((item) => formatTableName(item.name)).join(',')}.`);
  }

  const loadedDataWithViews = parsedViews.length
    ? await loadData(
        ctx,
        [...currentData, ...loadedData],
        parsedViews.flatMap(({ queryInterface }) => extractDataFromQueryInterface(queryInterface)),
      )
    : [];

  const loadedViews = parsedViews.map((view) => ({
    ...view,
    columns: toLoadedQueryInterface(loadedDataWithViews)(view.queryInterface).results,
  }));

  return [...currentData, ...loadedData, ...loadedViews];
};

const toSourceTables = (source: Source): DataTable[] => {
  switch (source.type) {
    case 'Table':
      return [{ type: 'Table', name: toTableName(source.schema, source.table) }];
    case 'Query':
      return source.value.sources.flatMap(toSourceTables);
    case 'Values':
      return [];
  }
};

const extractDataFromType = (type: Type): Data[] => {
  switch (type.type) {
    case 'LoadRecord':
      return [{ type: 'Enum', name: { name: type.name, schema: type.schema ?? '_' } }];
    case 'LoadFunction':
    case 'LoadFunctionArgument':
      return [
        { type: 'Function', name: { name: type.name, schema: type.schema ?? '_' } },
        ...type.args.flatMap(extractDataFromType),
      ];
    case 'Named':
      return extractDataFromType(type.value);
    case 'Array':
      return extractDataFromType(type.items);
    case 'Coalesce':
      return type.items.flatMap(extractDataFromType);
    case 'LoadFunction':
      return type.args.flatMap(extractDataFromType);
    case 'LoadOperator':
      return extractDataFromType(type.left).concat(extractDataFromType(type.right));
    default:
      return [];
  }
};

export const extractDataSources = (sources: Source[]): DataTable[] => sources.flatMap(toSourceTables);

const extractDataFromQueryInterface = ({ sources, params, results }: QueryInterface): Data[] => [
  ...extractDataSources(sources),
  ...params.flatMap(({ type, pick }) => [
    ...extractDataFromType(type),
    ...pick.flatMap(({ type }) => extractDataFromType(type)),
  ]),
  ...results.flatMap(({ type }) => extractDataFromType(type)),
];

const notLoaded =
  (data: LoadedData[]) =>
  ({ type, name }: Data) =>
    !data.some((item) => type === item.type && isEqual(name, item.name));

const toLoadedParam =
  (toType: (type: Type) => TypeConstant) =>
  ({ name, type, pick, spread, required }: Param): LoadedParam => {
    const paramType: TypeConstant =
      pick.length > 0
        ? {
            type: 'ObjectLiteralConstant',
            nullable: !required,
            items: pick.map((item) => ({ name: item.name, type: toType(item.type) })),
          }
        : { type: 'OptionalConstant', nullable: !required, value: toType(type) };
    return { name, type: spread ? { type: 'ArrayConstant', items: paramType } : paramType };
  };

const groupLoadedParams = (params: LoadedParam[]): LoadedParam[] =>
  Object.entries(groupBy((param) => param.name, params)).map(([name, params]) =>
    params.length === 1
      ? params[0]
      : {
          name,
          type: {
            type: 'UnionConstant',
            nullable: params.some((param) => 'nullable' in param.type && param.type.nullable),
            items: params.map((param) => param.type),
          },
        },
  );

const loadTypeConstant = (type: string, nullable?: boolean, comment?: string): TypeConstant => {
  const sqlType = toPgType(type);
  if (!sqlType) {
    throw Error(`'${type}' was not part of the known postgres types or aliases`);
  }
  return nullable && isTypeNullable(sqlType) ? { ...sqlType, nullable, comment } : { ...sqlType, comment };
};

const dataColumnToTypeConstant = (
  composites: TypeCompositeConstant[],
  enums: Record<string, TypeUnionConstant>,
  column: LoadedDataTable['data'][0],
): TypeConstant =>
  column.type === 'USER-DEFINED'
    ? enums[column.record]
      ? { ...enums[column.record], nullable: column.isNullable === 'YES', comment: column.comment }
      : composites.find((item) => column.record === item.name) ?? { type: 'Unknown' }
    : loadTypeConstant(column.type, column.isNullable === 'YES', column.comment);

const toLoadedFunction = ({ data, name }: LoadedDataFunction): LoadedFunction => ({
  name: name.name,
  schema: name.schema,
  isAggregate: data.isAggregate,
  returnType: loadTypeConstant(data.returnType),
  argTypes: data.argTypes.map((arg) => loadTypeConstant(arg)),
});

const toLoadedComposite = ({ data, name }: LoadedDataComposite): TypeCompositeConstant => ({
  name: name.name,
  type: 'CompositeConstant',
  schema: name.schema,
  attributes: data.reduce<Record<string, TypeConstant>>(
    (acc, attr) => ({
      ...acc,
      [attr.name]: loadTypeConstant(attr.type, attr.isNullable === 'YES'),
    }),
    {},
  ),
});

const toLoadedEnum = (enums: LoadedDataEnum[]): Record<string, TypeUnionConstant> =>
  enums.reduce<Record<string, TypeUnionConstant>>(
    (acc, { name, data: items }) => ({
      ...acc,
      [name.name]: { type: 'UnionConstant', items: items.map((item) => ({ type: 'String', literal: item })) },
    }),
    {},
  );

const toTableName = (schema: string | undefined, name: string): QualifiedName => ({
  name: name.toLowerCase(),
  schema: schema?.toLowerCase() ?? 'public',
});

const toLoadedSource = (
  data: LoadedData[],
  enums: Record<string, TypeUnionConstant>,
  composites: TypeCompositeConstant[],
) => {
  const tables = data.filter(isLoadedDataTable);
  const views = data.filter(isLoadedDataView);
  const loadedQueryInterface = toLoadedQueryInterface(data);

  return (source: Source): LoadedSource => {
    switch (source.type) {
      case 'Table':
        const view = views.find((item) => isEqual(item.name, toTableName(source.schema, source.table)));
        if (view) {
          return {
            type: 'View',
            name: source.name,
            table: view.name.name,
            schema: view.name.schema,
            items: view.columns.reduce<Record<string, TypeConstant>>(
              (acc, column) => ({ ...acc, [column.name]: column.type }),
              {},
            ),
          };
        }

        const table = tables.find((table) => isEqual(table.name, toTableName(source.schema, source.table)));
        if (!table) {
          throw new LoadError(source.sourceTag, `Table ${formatTableName(source)} not found in the database`);
        }
        return {
          type: 'Table',
          name: source.name,
          table: table.name.name,
          schema: table.name.schema,
          isResult: source.isResult,
          items: table.data.reduce<Record<string, TypeConstant>>(
            (acc, column) => ({ ...acc, [column.name]: dataColumnToTypeConstant(composites, enums, column) }),
            {},
          ),
        };
      case 'Values':
        const toValuesType = toTypeConstant(toLoadedContext(data, []), true);
        return {
          type: 'Values',
          name: source.name,
          items:
            source.types?.reduce<Record<string, TypeConstant>>(
              (acc, column) => ({ ...acc, [column.name]: toValuesType(column) }),
              {},
            ) ?? {},
        };
      case 'Query':
        return {
          type: 'Query',
          name: source.name,
          items: loadedQueryInterface(source.value).results.reduce<Record<string, TypeConstant>>(
            (acc, result) => ({ ...acc, [result.name]: result.type }),
            {},
          ),
        };
    }
  };
};

export const toLoadedContext = (data: LoadedData[], sources: Source[]): LoadedContext => {
  const enums = toLoadedEnum(data.filter(isLoadedDataEnum));
  const composites = data.filter(isLoadedDataComposite).map(toLoadedComposite);
  const loadedSources = sources.map(toLoadedSource(data, enums, composites));
  const funcs = data.filter(isLoadedDataFunction).map(toLoadedFunction);

  return { sources: loadedSources, funcs, enums, composites };
};

const matchFuncVariant =
  (args: TypeConstant[]) =>
  (func: LoadedFunction): boolean =>
    func.argTypes.every((argType, index) => isTypeEqual(argType, args[index] ?? { type: 'Unknown' }));

const isResultSource = (isResult: boolean) => (source: LoadedSource) =>
  source.type === 'Table' ? (isResult ? source.isResult : true) : true;

const matchTypeSource = (type: TypeLoadColumn) => (source: LoadedSource) =>
  type.table
    ? source.type === 'Table' && type.schema
      ? source.schema === type.schema && source.name == type.table
      : source.name === type.table
    : true;

const formatLoadedSource = (source: LoadedSource): string =>
  source.type === 'Table' ? `[${source.name}: (${formatTableName(source)})]` : `[${source.name}: Subquery]`;

const formatTableName = ({ table, name, schema }: { table?: string; name: string; schema?: string }): string => {
  const tableName = table ? `${name} (${table})` : name;
  return [schema, tableName].filter(isNil).join('.');
};

const formatArgumentType = ({ type }: Type): string => type;

const formatLoadColumn = ({ schema, table, column }: TypeLoadColumn): string =>
  [schema, table, column].filter(isNil).join('.');

const toTypeConstant = (context: LoadedContext, isResult: boolean) => {
  return (type: Type): TypeConstant => {
    const recur = toTypeConstant(context, isResult);
    switch (type.type) {
      case 'LoadColumn':
        const relevantSources = context.sources.filter(matchTypeSource(type)).filter(isResultSource(isResult));
        const columns = relevantSources.flatMap((source) => source.items[type.column.toLowerCase()] ?? []);

        if (relevantSources.length === 0) {
          throw new LoadError(
            type.sourceTag,
            `Column ${formatLoadColumn(type)} is not present in ${context.sources.map(formatLoadedSource).join(', ')}`,
          );
        } else if (columns.length > 1) {
          throw new LoadError(
            type.sourceTag,
            `Ambiguous column ${formatLoadColumn(type)}, appears in multiple tables: (${relevantSources
              .map(formatLoadedSource)
              .join(', ')}).`,
          );
        } else if (columns.length === 0) {
          throw new LoadError(
            type.sourceTag,
            `Column ${formatLoadColumn(type)} not found in ${relevantSources.map(formatLoadedSource).join(', ')}`,
          );
        } else {
          return columns[0];
        }
      case 'LoadRecord':
        if (context.enums[type.name]) {
          return context.enums[type.name];
        } else {
          const composite = context.composites.find((item) =>
            type.schema ? item.schema === type.schema && item.name === type.name : item.name === type.name,
          );
          if (composite) {
            return {
              type: 'CompositeConstant',
              name: type.name,
              schema: type.schema,
              attributes: composite.attributes,
            };
          } else {
            return { type: 'Unknown' };
          }
        }
      case 'LoadColumnCast':
        const columnType = recur(type.column);
        const castType = recur(type.value);
        return 'nullable' in columnType
          ? { type: 'OptionalConstant', value: castType, nullable: columnType.nullable }
          : castType;

      case 'LoadFunction':
      case 'LoadFunctionArgument':
        const args = type.args.map(recur);
        const variants = context.funcs.filter((func) => func.name === type.name);
        const funcVariant = variants.find(matchFuncVariant(args));

        if (!funcVariant) {
          const formattedArgs = args.map(formatArgumentType).join(', ');
          const availableVariants = variants
            .map((variant) => `(${variant.argTypes.map(formatArgumentType).join(', ')})`)
            .join(', ');

          throw new LoadError(
            type.sourceTag,
            `No variant of ${type.name} with arguments: (${formattedArgs}). Available variants were: ${availableVariants}`,
          );
        } else {
          switch (type.type) {
            case 'LoadFunction':
              return funcVariant.isAggregate && isTypeArrayConstant(funcVariant.returnType)
                ? funcVariant.returnType.items
                : funcVariant.returnType;
            case 'LoadFunctionArgument':
              return funcVariant.argTypes[type.index];
          }
        }
      case 'LoadStar':
        throw new LoadError(type.sourceTag, 'Should never have load star here');
      case 'Optional':
        return { type: 'OptionalConstant', nullable: type.nullable, value: recur(type.value) };
      case 'ToArray':
        const items = recur(type.items);
        return isTypeArrayConstant(items) ? items : { type: 'ArrayConstant', items };
      case 'Array':
        return { type: 'ArrayConstant', items: recur(type.items) };
      case 'Union':
        return { type: 'UnionConstant', items: type.items.map(recur) };
      case 'ArrayItem':
        return recur(type.value);
      case 'CompositeAccess':
        const composite = recur(type.value);
        if (!isTypeCompositeConstant(composite)) {
          throw new LoadError(type.sourceTag, 'Composite type access can be performed only on composite types');
        }
        const compositeFieldType = composite.attributes[type.name];
        if (!compositeFieldType) {
          throw new LoadError(
            type.sourceTag,
            `Composite type ${formatTableName(composite)} does not have a field named ${type.name}`,
          );
        }
        return compositeFieldType;
      case 'ObjectLiteral':
        return {
          type: 'ObjectLiteralConstant',
          items: type.items.map((item) => ({ ...item, type: recur(item.type) })),
        };
      case 'LoadOperator':
        const left = recur(type.left);
        const right = recur(type.right);
        const operatorResult = toContantBinaryOperatorVariant(type.available, left, right, type.index);
        return isTypeNullable(operatorResult) &&
          ((isTypeNullable(left) && left.nullable) || (isTypeNullable(right) && right.nullable))
          ? { ...operatorResult, nullable: true }
          : operatorResult;
      case 'Coalesce':
        const argTypes = type.items.map(recur);
        const nullable = argTypes.reduce<boolean>(
          (isNullable, type) => isNullable && isTypeNullable(type) && Boolean(type.nullable),
          true,
        );
        return argTypes.every((arg) => arg.type === argTypes[0].type)
          ? isTypeNullable(argTypes[0])
            ? { ...argTypes[0], nullable }
            : argTypes[0]
          : { type: 'UnionConstant', items: argTypes, nullable };
      case 'Named':
        return recur(type.value);
      default:
        return type;
    }
  };
};

export const loadQueryInterfacesData = async (
  ctx: LoadContext,
  queryInterfaces: QueryInterface[],
  data: LoadedData[],
): Promise<LoadedData[]> => await loadData(ctx, data, queryInterfaces.flatMap(extractDataFromQueryInterface));

export const toLoadedQueryInterface =
  (data: LoadedData[]) =>
  ({ sources, params, results }: QueryInterface): LoadedQueryInterface => {
    const context = toLoadedContext(data, sources);
    const toTypeParam = toTypeConstant(context, false);
    const toTypeResult = toTypeConstant(context, true);
    return {
      params: groupLoadedParams(params.map(toLoadedParam(toTypeParam))),
      results: results.flatMap(({ name, type }) =>
        isTypeLoadStar(type)
          ? context.sources
              .filter((source) => (type.table ? source.name === type.table : true))
              .flatMap((source) => Object.entries(source.items).map(([name, type]) => ({ name, type })))
          : { name, type: toTypeResult(type) },
      ),
    };
  };
