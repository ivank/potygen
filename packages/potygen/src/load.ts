/**
 * load.ts
 *
 * The "last stage" for converting from an SQL ast to what the actual typescript types are.
 * Converting the plan generated from [query-interface.ts](./query-interface.ts) into actual types.
 * Loads the needed data from the database.
 */

import { isEqual, groupBy, isNil, isEmpty, isUniqueBy, first } from './util';
import { parser } from './grammar';
import {
  QueryInterface,
  Source,
  TypeOrLoad,
  Type,
  TypeUnion,
  TypeLoadColumn,
  Param,
  TypeComposite,
  TypeName,
} from './query-interface.types';
import {
  isTypeNullable,
  isTypeArray,
  isTypeLoadStar,
  isTypeComposite,
  isSourceQuery,
  isTypeEqual,
  isType,
  isTypeDate,
  isTypeBuffer,
} from './query-interface.guards';
import {
  isDataTable,
  isDataFunction,
  isDataEnum,
  isLoadedDataTable,
  isLoadedDataEnum,
  isLoadedDataFunction,
  isLoadedDataView,
  isLoadedDataComposite,
  isDataViewRaw,
  isNotDataViewRaw,
  isLoadedSourceUnknown,
  isLoadedSource,
} from './load.guards';
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
  LoadContext,
  QualifiedName,
  LoadedDataRaw,
  LoadedSourceWithUnknown,
  LoadedContextWithUnknown,
} from './load.types';
import { inspect } from 'util';
import { allSql, selectedSql } from './load.queries';
import { toConstantBinaryOperatorVariant, toPgTypeConstant, toQueryInterface } from './query-interface';

/**
 * If a list of names is empty construct a list that delibertly wouldn't match anything.
 * This is because sql cannot search for empty lists.
 */
const orEmptyNameList = (names: QualifiedName[]): QualifiedName[] =>
  names.length === 0 ? [{ name: '_', schema: '_' }] : names;

/**
 * Convert {@link LoadedDataRaw} into {@link LoadedData} by loading and parsing all the views
 */
const toLoadedData = async (
  ctx: LoadContext,
  currentData: LoadedData[],
  loadedDataRaw: LoadedDataRaw[],
): Promise<LoadedData[]> => {
  const loadedData = loadedDataRaw.filter(isNotDataViewRaw);
  const currentLoadedData = [...currentData, ...loadedData];

  const parsedViews = loadedDataRaw
    .filter(isDataViewRaw)
    .map((view) => ({ ...view, queryInterface: toQueryInterface(parser(view.data).ast) }));

  if (parsedViews.length) {
    ctx.logger.debug(`Load views: ${parsedViews.map((item) => formatTableName(item.name)).join(',')}.`);
  }

  const loadedDataWithViews = parsedViews.length
    ? await loadData(
        ctx,
        currentLoadedData,
        parsedViews.flatMap(({ queryInterface }) => extractDataFromQueryInterface(queryInterface)),
      )
    : [];

  const loadedViews = parsedViews.map((view) => ({
    ...view,
    columns: toLoadedQueryInterface(loadedDataWithViews)(view.queryInterface).results,
  }));

  return [...currentLoadedData, ...loadedViews];
};

export const loadAllData = async (ctx: LoadContext, currentData: LoadedData[]): Promise<LoadedData[]> => {
  ctx.logger.debug(`Load all data`);
  const loaded = await allSql(ctx.db, {});
  ctx.logger.debug(`Loaded additional data: ${loaded.length}.`);
  return await toLoadedData(ctx, currentData, loaded);
};

/**
 * Convert {@link Data} object into their {@link LoadedData} counterparts.
 * If any of them already exist in the `currentData` array, skip.
 */
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
  try {
    const loaded = await selectedSql(ctx.db, {
      tableNames: orEmptyNameList(tableNames),
      functionNames: orEmptyNameList(functionNames),
      enumNames: orEmptyNameList(enumNames),
      compositeNames: orEmptyNameList(compositeNames),
    });
    ctx.logger.debug(`Loaded additional data: ${loaded.length}.`);

    return await toLoadedData(ctx, currentData, loaded);
  } catch (error) {
    console.log({
      tableNames: orEmptyNameList(tableNames),
      functionNames: orEmptyNameList(functionNames),
      enumNames: orEmptyNameList(enumNames),
      compositeNames: orEmptyNameList(compositeNames),
    });
    ctx.logger.error(`Error loading data: ${String(error)}`, { sql: selectedSql().sql });
    throw error;
  }
};

/**
 * Find which {@link DataTable} to load from {@link Source} array
 */
const toSourceTables = (source: Source): DataTable[] => {
  switch (source.type) {
    case 'Table':
      return [{ type: 'Table', name: toTableName(source.schema, source.table) }];
    case 'Query':
      return source.value.sources.flatMap(toSourceTables);
    case 'Values':
    case 'Recordset':
      return [];
  }
};

/**
 * Find which additional data needs to be loaded for {@link TypeOrLoad} to be converted to {@link Type}
 */
const extractDataFromType = (type: TypeOrLoad): Data[] => {
  if (isType(type)) {
    return [];
  } else {
    switch (type.type) {
      case TypeName.LoadColumn:
      case TypeName.LoadStar:
        return [];
      case TypeName.LoadRecord:
        return [{ type: 'Enum', name: { name: type.name, schema: type.schema ?? '_' } }];
      case TypeName.LoadFunction:
      case TypeName.LoadFunctionArgument:
        return [
          { type: 'Function', name: { name: type.name, schema: type.schema ?? '_' } },
          ...type.args.flatMap(extractDataFromType),
        ];
      case TypeName.LoadOptional:
      case TypeName.LoadNamed:
      case TypeName.LoadCompositeAccess:
      case TypeName.LoadColumnCast:
      case TypeName.LoadArrayItem:
        return extractDataFromType(type.value);
      case TypeName.LoadArray:
      case TypeName.LoadAsArray:
        return extractDataFromType(type.items);
      case TypeName.LoadCoalesce:
      case TypeName.LoadUnion:
        return type.items.flatMap(extractDataFromType);
      case TypeName.LoadObjectLiteral:
        return type.items.flatMap((item) => extractDataFromType(item.type));
      case TypeName.LoadOperator:
        return extractDataFromType(type.left).concat(extractDataFromType(type.right));
    }
  }
};

/**
 * Get all {@link DataTable} to be loaded for the given {@link Source} array
 */
export const extractDataSources = (sources: Source[]): DataTable[] => sources.flatMap(toSourceTables);

/**
 * Get all the {@link Data} needed to load a {@link QueryInterface} and convert it to {@link LoadedQueryInterface}
 */
const extractDataFromQueryInterface = ({ sources, params, results }: QueryInterface): Data[] => [
  ...extractDataSources(sources),
  ...params.flatMap(({ type, pick }) => [
    ...extractDataFromType(type),
    ...pick.flatMap(({ type }) => extractDataFromType(type)),
  ]),
  ...results.flatMap(({ type }) => extractDataFromType(type)),
];

/**
 * Has a {@link Data} object already been loaded
 */
const notLoaded =
  (data: LoadedData[]) =>
  ({ type, name }: Data) =>
    !data.some((item) => type === item.type && isEqual(name, item.name));

/**
 * Convert a {@link Param} to a {@link LoadedParam} by loading the underlying {@link TypeOrLoad} and converting it to {@link Type}
 */
const toLoadedParam =
  (toType: (type: TypeOrLoad) => Type) =>
  ({ name, type, pick, spread, required }: Param): LoadedParam => {
    const paramType: Type =
      pick.length > 0
        ? {
            type: TypeName.ObjectLiteral,
            nullable: !required,
            items: pick.map((item) => ({ name: item.name, type: toType(item.type) })),
            postgresType: 'json',
          }
        : { type: TypeName.Optional, nullable: !required, value: toType(type), postgresType: 'any' };
    return { name, type: spread ? { type: TypeName.Array, items: paramType, postgresType: 'anyarray' } : paramType };
  };

/**
 * Group {@link LoadedParam} with the same name into a union of their types.
 */
const groupLoadedParams = (params: LoadedParam[]): LoadedParam[] =>
  Object.entries(groupBy((param) => param.name, params)).map(([name, params]) =>
    params.length === 1
      ? params[0]
      : {
          name,
          type: {
            type: TypeName.Union,
            nullable: params.some((param) => 'nullable' in param.type && param.type.nullable),
            items: params.map((param) => param.type),
            postgresType: 'any',
          },
        },
  );

/**
 * Determine the {@link Type} for a postgres data type
 */
const loadPgType = (type: string, nullable?: boolean, comment?: string): Type => {
  const sqlType = toPgTypeConstant(type);
  if (!sqlType) {
    throw Error(`'${type}' was not part of the known postgres types or aliases`);
  }
  return nullable && isTypeNullable(sqlType)
    ? { ...sqlType, nullable, comment, postgresType: type }
    : { ...sqlType, comment, postgresType: type };
};

/**
 * Determine the {@link Type} of a column. Load the user defined types like enums and composites.
 */
const dataColumnToType = (
  composites: TypeComposite[],
  enums: Record<string, TypeUnion>,
  column: LoadedDataTable['data'][0],
): Type => {
  if (column.type === 'ARRAY' && column.record.startsWith('_')) {
    const type = column.record.substring(1);

    return {
      type: TypeName.Array,
      items: enums[type]
        ? enums[type]
        : composites.find((item) => type === item.name) ??
          toPgTypeConstant(type) ?? { type: TypeName.Unknown, postgresType: 'any' },
      nullable: column.isNullable === 'YES',
      comment: column.comment,
      postgresType: type + '[]',
    };
  } else {
    return column.type === 'USER-DEFINED'
      ? enums[column.record]
        ? {
            ...enums[column.record],
            nullable: column.isNullable === 'YES',
            comment: column.comment,
            postgresType: column.record,
          }
        : composites.find((item) => column.record === item.name) ?? { type: TypeName.Unknown, postgresType: 'any' }
      : loadPgType(column.type, column.isNullable === 'YES', column.comment);
  }
};

const toLoadedFunction = ({ data, name, comment }: LoadedDataFunction): LoadedFunction => ({
  name: name.name,
  schema: name.schema,
  isAggregate: data.isAggregate,
  returnType: loadPgType(data.returnType),
  argTypes: data.argTypes.map((arg) => loadPgType(arg)),
  comment,
});

const toLoadedComposite = ({ data, name }: LoadedDataComposite): TypeComposite => ({
  name: name.name,
  type: TypeName.Composite,
  schema: name.schema,
  postgresType: name.name,
  attributes: data.reduce<Record<string, Type>>(
    (acc, attr) => ({
      ...acc,
      [attr.name]: loadPgType(attr.type, attr.isNullable === 'YES'),
    }),
    {},
  ),
});

const toLoadedEnum = (enums: LoadedDataEnum[]): Record<string, TypeUnion> =>
  enums.reduce<Record<string, TypeUnion>>(
    (acc, { name, data: items }) => ({
      ...acc,
      [name.name]: {
        type: TypeName.Union,
        postgresType: name.name,
        items: items.map((item) => ({ type: TypeName.String, literal: item, postgresType: 'text' })),
      },
    }),
    {},
  );

const toTableName = (schema: string | undefined, name: string): QualifiedName => ({
  name: name.toLowerCase(),
  schema: schema?.toLowerCase() ?? 'public',
});

const toLoadedSource = ({
  data,
  enums,
  composites,
  sources,
}: {
  data: LoadedData[];
  enums: Record<string, TypeUnion>;
  composites: TypeComposite[];
  sources: Source[];
}) => {
  const tables = data.filter(isLoadedDataTable);
  const views = data.filter(isLoadedDataView);
  const loadedQueryInterface = toLoadedQueryInterface(data);
  const querySources = sources.filter(isSourceQuery);

  return (source: Source): LoadedSourceWithUnknown => {
    const toColumnType = toType(throwOnUnknownLoadedContext(toLoadedContext({ data, sources: [] })), true);
    switch (source.type) {
      case 'Table':
        const view = views.find((item) => isEqual(item.name, toTableName(source.schema, source.table)));
        if (view) {
          return {
            type: 'View',
            name: source.name,
            table: view.name.name,
            schema: view.name.schema,
            items: view.columns.reduce<Record<string, Type>>(
              (acc, column) => ({ ...acc, [column.name]: column.type }),
              {},
            ),
          };
        }

        /**
         * If we've joined a CTE and renmaed it, we need to add another query source with that name
         */
        const querySource = querySources.find((item) => item.name === source.table);
        if (querySource) {
          return {
            ...toLoadedSource({ data, enums, composites, sources })(querySource),
            name: source.name,
          };
        }

        const table = tables.find((table) => isEqual(table.name, toTableName(source.schema, source.table)));
        if (!table) {
          return { type: 'Unknown', source, name: source.name };
        }
        return {
          type: 'Table',
          name: source.name,
          table: table.name.name,
          schema: table.name.schema,
          isResult: source.isResult,
          items: table.data.reduce<Record<string, Type>>(
            (acc, column) => ({ ...acc, [column.name]: dataColumnToType(composites, enums, column) }),
            {},
          ),
        };
      case 'Values':
        // const toValuesType = toType(throwOnUnknownLoadedContext(toLoadedContext({ data, sources: [] })), true);
        return {
          type: 'Values',
          name: source.name,
          items:
            source.types?.reduce<Record<string, Type>>(
              (acc, column) => ({ ...acc, [column.name]: toColumnType(column) }),
              {},
            ) ?? {},
        };
      case 'Query':
        return {
          type: 'Query',
          name: source.name,
          items: loadedQueryInterface(source.value).results.reduce<Record<string, Type>>(
            (acc, result) => ({ ...acc, [result.name]: result.type }),
            {},
          ),
        };
      case 'Recordset':
        return {
          type: 'Recordset',
          name: source.name,
          isResult: source.isResult,
          items:
            source.columns?.reduce<Record<string, Type>>(
              (acc, column) => ({ ...acc, [column.name]: toColumnType(column) }),
              {},
            ) ?? {},
        };
    }
  };
};

export const toLoadedContext = ({
  data,
  sources,
}: {
  data: LoadedData[];
  sources: Source[];
}): LoadedContextWithUnknown => {
  const enums = toLoadedEnum(data.filter(isLoadedDataEnum));
  const composites = data.filter(isLoadedDataComposite).map(toLoadedComposite);
  const loadedSources = sources.map(toLoadedSource({ data, enums, composites, sources }));
  const funcs = data.filter(isLoadedDataFunction).map(toLoadedFunction);

  return { sources: loadedSources, funcs, enums, composites };
};
export const filterUnknownLoadedContext = (context: LoadedContextWithUnknown): LoadedContext => ({
  ...context,
  sources: context.sources.filter(isLoadedSource),
});

export const throwOnUnknownLoadedContext = (context: LoadedContextWithUnknown): LoadedContext => {
  const unknown = first(context.sources.filter(isLoadedSourceUnknown));
  if (unknown) {
    throw new LoadError(unknown.source.sourceTag, `Table ${formatTableName(unknown.source)} not found`);
  }
  return filterUnknownLoadedContext(context);
};

const matchFuncVariant =
  (args: Type[]) =>
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

const typeNames: { [key in TypeName]: string } = {
  [TypeName.Buffer]: 'Buffer',
  [TypeName.Any]: 'Any',
  [TypeName.String]: 'String',
  [TypeName.Number]: 'Number',
  [TypeName.BigInt]: 'BigInt',
  [TypeName.Boolean]: 'Boolean',
  [TypeName.Date]: 'Date',
  [TypeName.Null]: 'Null',
  [TypeName.Json]: 'Json',
  [TypeName.Unknown]: 'Unknown',
  [TypeName.Composite]: 'Composite',
  [TypeName.Array]: 'Array',
  [TypeName.Union]: 'Union',
  [TypeName.ObjectLiteral]: 'ObjectLiteral',
  [TypeName.Optional]: 'Optional',
  [TypeName.LoadCoalesce]: 'LoadCoalesce',
  [TypeName.LoadColumnCast]: 'LoadColumnCast',
  [TypeName.LoadRecord]: 'LoadRecord',
  [TypeName.LoadFunction]: 'LoadFunction',
  [TypeName.LoadColumn]: 'LoadColumn',
  [TypeName.LoadStar]: 'LoadStar',
  [TypeName.LoadFunctionArgument]: 'LoadFunctionArgument',
  [TypeName.LoadOperator]: 'LoadOperator',
  [TypeName.LoadNamed]: 'LoadNamed',
  [TypeName.LoadArray]: 'LoadArray',
  [TypeName.LoadAsArray]: 'LoadAsArray',
  [TypeName.LoadArrayItem]: 'LoadArrayItem',
  [TypeName.LoadCompositeAccess]: 'LoadCompositeAccess',
  [TypeName.LoadUnion]: 'LoadUnion',
  [TypeName.LoadObjectLiteral]: 'LoadObjectLiteral',
  [TypeName.LoadOptional]: 'LoadOptional',
};

const formatArgumentType = (val: TypeOrLoad): string =>
  `type: ${typeNames[val.type]}${'postgresType' in val ? `(${val.postgresType})` : ''}`;

const formatLoadColumn = ({ schema, table, column }: TypeLoadColumn): string =>
  [schema, table, column].filter(isNil).join('.');

const serializeJsonObjectType = (type: Type, isJsonObject?: boolean): Type =>
  isJsonObject && (isTypeDate(type) || isTypeBuffer(type)) ? { ...type, type: TypeName.String } : type;

const toType = (context: LoadedContext, isResult: boolean, isJsonObject?: boolean) => {
  return (type: TypeOrLoad): Type => {
    const recur = toType(context, isResult, isJsonObject);

    switch (type.type) {
      case TypeName.LoadColumn:
        const relevantSources = context.sources.filter(matchTypeSource(type)).filter(isResultSource(isResult));
        const columns = relevantSources.flatMap((source) => source.items[type.column] ?? []);

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
          return serializeJsonObjectType(columns[0], isJsonObject);
        }
      case TypeName.LoadRecord:
        if (context.enums[type.name]) {
          return context.enums[type.name];
        } else {
          const composite = context.composites.find((item) =>
            type.schema ? item.schema === type.schema && item.name === type.name : item.name === type.name,
          );
          if (composite) {
            return {
              type: TypeName.Composite,
              name: type.name,
              postgresType: type.name,
              schema: type.schema,
              attributes: composite.attributes,
            };
          } else {
            return { type: TypeName.Unknown, postgresType: 'any' };
          }
        }
      case TypeName.LoadColumnCast:
        const columnType = recur(type.column);
        const castType = recur(type.value);
        return 'nullable' in columnType
          ? {
              type: TypeName.Optional,
              value: castType,
              nullable: columnType.nullable,
              postgresType: columnType.postgresType,
            }
          : castType;

      case TypeName.LoadFunction:
      case TypeName.LoadFunctionArgument:
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
            `No variant of function "${type.name}" with arguments: (${formattedArgs}). Available variants were: ${availableVariants}`,
          );
        } else {
          switch (type.type) {
            case TypeName.LoadFunction:
              return funcVariant.isAggregate && isTypeArray(funcVariant.returnType)
                ? funcVariant.returnType.items
                : funcVariant.returnType;
            case TypeName.LoadFunctionArgument:
              return funcVariant.argTypes[type.index];
          }
        }
      case TypeName.LoadStar:
        throw new LoadError(type.sourceTag, 'Should never have load star here');
      case TypeName.LoadOptional:
        const optionalType = recur(type.value);
        return {
          type: TypeName.Optional,
          nullable: type.nullable,
          value: optionalType,
          postgresType: optionalType.postgresType,
        };
      case TypeName.LoadAsArray:
        const items = recur(type.items);
        return isTypeArray(items) ? items : { type: TypeName.Array, items, postgresType: `${items.postgresType}[]` };
      case TypeName.LoadArray:
        const itemsType = toType(context, isResult, type.isJsonObject)(type.items);
        return { type: TypeName.Array, items: itemsType, postgresType: `${itemsType.postgresType}[]` };
      case TypeName.LoadUnion:
        return { type: TypeName.Union, items: type.items.map(recur), postgresType: 'any' };
      case TypeName.LoadArrayItem:
        return recur(type.value);
      case TypeName.LoadCompositeAccess:
        const composite = recur(type.value);
        if (!isTypeComposite(composite)) {
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
      case TypeName.LoadObjectLiteral:
        return {
          type: TypeName.ObjectLiteral,
          items: type.items.map((item) => ({ ...item, type: toType(context, isResult, type.isJsonObject)(item.type) })),
          postgresType: 'json',
        };
      case TypeName.LoadOperator:
        const left = recur(type.left);
        const right = recur(type.right);
        const operatorResult = toConstantBinaryOperatorVariant(type.available, left, right, type.part);
        return isTypeNullable(operatorResult) &&
          ((isTypeNullable(left) && left.nullable) || (isTypeNullable(right) && right.nullable))
          ? { ...operatorResult, nullable: true }
          : operatorResult;
      case TypeName.LoadCoalesce:
        const argTypes = type.items.map(recur);
        const nullable = argTypes.reduce<boolean>(
          (isNullable, type) => isNullable && isTypeNullable(type) && Boolean(type.nullable),
          true,
        );
        return argTypes.every((arg) => arg.type === argTypes[0].type)
          ? isTypeNullable(argTypes[0])
            ? { ...argTypes[0], nullable }
            : argTypes[0]
          : { type: TypeName.Union, items: argTypes, nullable, postgresType: 'any' };
      case TypeName.LoadNamed:
        return recur(type.value);
      case TypeName.Date:
      case TypeName.Buffer:
        return serializeJsonObjectType(type, isJsonObject);
      default:
        return type;
    }
  };
};

/**
 * Extract the data needed to generate the types for all the queryInterfaces, and load them.
 *
 * If the data is already present in data, it will not be loaded again.
 * This way the function can safely be called on a persistant data store taht is can be kept between executions.
 */
export const loadQueryInterfacesData = async (
  ctx: LoadContext,
  queryInterfaces: QueryInterface[],
  data: LoadedData[],
): Promise<LoadedData[]> => await loadData(ctx, data, queryInterfaces.flatMap(extractDataFromQueryInterface));

export const toLoadedQueryInterface =
  (data: LoadedData[]) =>
  ({ sources, params, results }: QueryInterface): LoadedQueryInterface => {
    const context = throwOnUnknownLoadedContext(toLoadedContext({ data, sources }));
    const toTypeParam = toType(context, false);
    const toTypeResult = toType(context, true);
    const sourceParams = sources
      .filter(isSourceQuery)
      .flatMap((source) => toLoadedQueryInterface(data)(source.value).params);

    return {
      params: groupLoadedParams(params.map(toLoadedParam(toTypeParam)).concat(sourceParams)),
      results: results.flatMap(({ name, type }) =>
        isTypeLoadStar(type)
          ? context.sources
              .filter((source) => (type.table ? source.name === type.table : true))
              .flatMap((source) => Object.entries(source.items).map(([name, type]) => ({ name, type })))
          : { name, type: toTypeResult(type) },
      ),
    };
  };
