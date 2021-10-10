import {
  FromTag,
  ExpressionTag,
  CombinationTag,
  OrderByTag,
  IdentifierTag,
  TypeTag,
  TypeArrayTag,
  SelectTag,
  SelectListItemTag,
  UpdateTag,
  FromListItemTag,
  JoinTag,
  TableTag,
  ReturningListItemTag,
  WhereTag,
  HavingTag,
  LimitTag,
  OffsetTag,
  UpdateFromTag,
  SelectListTag,
  DistinctTag,
  GroupByTag,
  SetTag,
  ReturningTag,
  ColumnsTag,
  ValuesListTag,
  ConflictTag,
  ArrayConstructorTag,
  InsertTag,
  DeleteTag,
  UsingTag,
  isSetList,
  isSelectTag,
  isColumns,
  isDefault,
  isUsing,
  isWhen,
  isValues,
  isParameter,
  isFrom,
  isSelectList,
  isQualifiedIdentifier,
  isIdentifier,
  isAs,
  isJoinOn,
  isExpression,
  isStarQualifiedIdentifier,
  isArrayIndexRange,
  isBoolean,
  isAnyCast,
  isTypeArray,
  isFunction,
  isRow,
  isUpdateFrom,
  isReturning,
  isTable,
  first,
  last,
  initial,
  isUnique,
  orderBy,
  isNil,
  FunctionTag,
} from '@psql-ts/ast';

import { isStarType, isColumnType, isUnionType, isConditionalType } from './query-interface.guards';
import {
  PropertyType,
  ConstantType,
  RecordType,
  ArrayType,
  Param,
  Result,
  QueryInterface,
  UnionType,
} from './query-interface.types';

interface QualifiedTableName {
  table: string;
  schema: string;
}

type TableAliases = Record<string, QualifiedTableName>;

interface QueryContext {
  table?: string;
  schema?: string;
  aliases: TableAliases;
  insertColumns?: ColumnsTag;
}

interface RawQuery {
  params: Array<ConvertableTag>;
  result: Array<SelectListItemTag | ReturningListItemTag>;
  context: QueryContext;
}

type ResolveIdentifier = (property: PropertyType) => PropertyType;

const toName = (aliases: TableAliases, table: QualifiedTableName): QualifiedTableName =>
  aliases[table?.table?.toLowerCase() ?? ''] ?? table;

type ConvertableTag =
  | FunctionTag
  | ExpressionTag
  | SelectListTag
  | OrderByTag
  | HavingTag
  | GroupByTag
  | DistinctTag
  | WhereTag
  | HavingTag
  | LimitTag
  | OffsetTag
  | CombinationTag
  | FromTag
  | UsingTag
  | UpdateFromTag
  | TableTag
  | ColumnsTag
  | SetTag
  | ValuesListTag
  | ConflictTag
  | ArrayConstructorTag
  | ReturningTag;

const toQualifiedTableName = (
  parts: IdentifierTag[],
  context: { table?: string; schema?: string } = {},
): QualifiedTableName => ({
  table: parts[1]
    ? parts[1].value?.toLowerCase()
    : parts[0]?.value?.toLowerCase() ?? context.table?.toLowerCase() ?? '',
  schema: parts[1] ? parts[0].value?.toLowerCase() : context.schema?.toLowerCase() ?? 'public',
});

const toTableAliasFrom = (list: FromListItemTag[]): TableAliases =>
  list.reduce((current, item) => {
    const alias = item.as?.value.value;
    return alias && isQualifiedIdentifier(item.value)
      ? {
          ...current,
          [alias?.toLowerCase()]: toName(current, toQualifiedTableName(item.value.values)),
        }
      : current;
  }, {});

const toTableAliasJoin = (list: JoinTag[]): TableAliases =>
  list.reduce((current, item) => {
    const alias = first(item.values.filter(isAs))?.value.value;
    return alias
      ? {
          ...current,
          [alias?.toLowerCase()]: toName(current, toQualifiedTableName(item.table.values)),
        }
      : current;
  }, {});

const toTableAliases = (from?: FromTag): TableAliases =>
  from ? { ...toTableAliasFrom(from.list.values), ...toTableAliasJoin(from.join) } : {};

const sqlTypes: { [type: string]: ConstantType | ArrayType } = {
  anyarray: { type: 'array', items: 'unknown' },
  anyelement: 'unknown',
  bigint: 'string',
  int8: 'string',
  bigserial: 'string',
  serial8: 'string',
  'bit varying': 'string',
  varbit: 'string',
  bit: 'string',
  boolean: 'boolean',
  bool: 'boolean',
  box: 'string',
  bytea: 'string',
  'character varying': 'string',
  varchar: 'string',
  character: 'string',
  char: 'string',
  cidr: 'string',
  circle: 'string',
  date: 'Date',
  'double precision': 'string',
  float8: 'string',
  inet: 'string',
  integer: 'number',
  int4: 'number',
  int: 'number',
  interval: 'string',
  jsonb: 'json',
  json: 'json',
  line: 'string',
  lseg: 'string',
  macaddr: 'string',
  money: 'string',
  numeric: 'string',
  decimal: 'string',
  path: 'string',
  pg_lsn: 'string',
  point: 'string',
  polygon: 'string',
  real: 'string',
  float: 'number',
  float4: 'number',
  smallint: 'number',
  int2: 'number',
  smallserial: 'number',
  serial2: 'number',
  serial4: 'number',
  serial: 'number',
  text: 'string',
  timestamptz: 'Date',
  timestamp: 'Date',
  'timestamp without time zone': 'Date',
  'timestamp with time zone': 'Date',
  timetz: 'Date',
  time: 'string',
  tsquery: 'string',
  tsvector: 'string',
  txid_snapshot: 'string',
  uuid: 'string',
  xml: 'string',
};

export const toConstantType = (type?: string): ConstantType | ArrayType =>
  type ? sqlTypes[type] ?? 'string' : 'string';

const unaryTypes: { [type: string]: ConstantType } = {
  '+': 'number',
  '-': 'number',
  '/': 'number',
  '*': 'number',
  OR: 'boolean',
  AND: 'boolean',
  NOT: 'boolean',
  '||': 'string',
};

const binaryOperatorTypes: {
  [type: string]: { left: ConstantType; right: ConstantType | UnionType | ArrayType; result?: ConstantType };
} = {
  '+': { left: 'number', right: 'number' },
  '-': { left: 'number', right: 'number' },
  '/': { left: 'number', right: 'number' },
  '*': { left: 'number', right: 'number' },
  OR: { left: 'boolean', right: 'boolean' },
  AND: { left: 'boolean', right: 'boolean' },
  NOT: { left: 'boolean', right: 'boolean' },
  '||': { left: 'string', right: 'string' },
  '->': { left: 'json', right: { type: 'union', items: ['number', 'string'] }, result: 'json' },
  '->>': { left: 'json', right: { type: 'union', items: ['number', 'string'] }, result: 'string' },
  '#>': { left: 'json', right: { type: 'array', items: 'string' }, result: 'json' },
  '#>>': { left: 'json', right: { type: 'array', items: 'string' }, result: 'string' },
  '?': { left: 'json', right: 'string', result: 'boolean' },
  '?|': { left: 'json', right: { type: 'array', items: 'string' }, result: 'boolean' },
  '?&': { left: 'json', right: { type: 'array', items: 'string' }, result: 'boolean' },
  '@>': { left: 'json', right: 'json', result: 'boolean' },
  '<@': { left: 'json', right: 'json', result: 'boolean' },
};

const convertType = (tag: TypeTag | TypeArrayTag): ConstantType | ArrayType | RecordType =>
  tag.tag === 'TypeArray'
    ? Array.from({ length: tag.dimensions }).reduce<ConstantType | ArrayType | RecordType>(
        (curr) => ({ type: 'array', items: curr }),
        convertType(tag.value),
      )
    : sqlTypes[tag.value] ?? { type: 'record', name: tag.value.toLowerCase() };

const convertExpressionMap = (
  context: { type?: Param['type']; table?: string; schema?: string; insertColumns?: ColumnsTag },
  tags: Array<ConvertableTag>,
): { type: PropertyType; params: Param[] } => ({
  type: 'unknown',
  params: tags.flatMap((tag) => convertExpression(context, tag).params),
});

const convertExpression = (
  context: { type?: Param['type']; table?: string; schema?: string; insertColumns?: ColumnsTag },
  tag: ConvertableTag,
): { type: PropertyType; params: Param[] } => {
  switch (tag.tag) {
    case 'SubqueryExpression':
      return {
        type: 'boolean',
        params: convertExpressionMap(context, [tag.value, tag.subquery].filter(isNil)).params,
      };
    case 'SelectList':
      return convertExpressionMap(context, tag.values.map((item) => item.value).filter(isExpression));
    case 'Returning':
      return convertExpressionMap(context, tag.values.map((item) => item.value).filter(isExpression));
    case 'NullIfTag':
      const nullIfValue = convertExpression(context, tag.value);
      return {
        type: { type: 'union', items: [nullIfValue.type, 'null'] },
        params: convertExpressionMap(context, [tag.value, tag.conditional]).params,
      };
    case 'ConditionalExpression':
      if (tag.type === 'COALESCE') {
        const type = tag.values.reduce<{ items: PropertyType[]; params: Param[] }>(
          (all, item) => {
            const type = convertExpression(context, item);
            return { items: all.items.concat(type.type), params: all.params.concat(type.params) };
          },
          { items: [], params: [] },
        );
        return {
          type: { type: 'conditional', name: tag.type.toLowerCase(), items: type.items },
          params: type.params,
        };
      } else {
        return {
          type: convertExpression(context, tag.values[0]).type,
          params: convertExpressionMap(context, tag.values).params,
        };
      }
    case 'ValuesList':
      return {
        type: 'unknown',
        params: tag.values
          .filter(isValues)
          .flatMap((columns) =>
            columns.values.flatMap((column, index) => {
              const columnType = context.insertColumns?.values[index];
              const type = columnType
                ? {
                    type: 'column' as const,
                    column: columnType.value.toLowerCase(),
                    ...toQualifiedTableName([], context),
                  }
                : undefined;
              return isDefault(column) ? undefined : convertExpression({ ...context, type }, column).params;
            }),
          )
          .filter(isNil)
          .concat(convertExpressionMap(context, tag.values.filter(isParameter)).params),
      };
    case 'From':
      return convertExpressionMap(
        context,
        tag.join.flatMap((item) => item.values.filter(isJoinOn).map((join) => join.value)),
      );
    case 'Using':
      return convertExpressionMap(
        context,
        tag.values.map((item) => item.value),
      );
    case 'Set':
      if (isSetList(tag.value)) {
        return convertExpressionMap(context, tag.value.values.map((item) => item.value).filter(isExpression));
      } else if (isSelectTag(tag.value.values)) {
        return convertExpression(context, tag.value.values);
      } else {
        return convertExpressionMap(context, tag.value.values.values.filter(isExpression));
      }
    case 'UpdateFrom':
      return convertExpressionMap(
        context,
        tag.values.map((item) => item.value),
      );
    case 'Combination':
      return { type: 'unknown', params: toQueryInterface(tag).params };
    case 'Where':
    case 'Having':
      return convertExpression(context, tag.value);
    case 'Limit':
    case 'Offset':
      return typeof tag.value.value === 'string'
        ? { type: 'unknown', params: [] }
        : convertExpression({ ...context, type: 'string' }, tag.value.value);
    case 'OrderBy':
      return convertExpressionMap(
        context,
        tag.values.map((item) => item.value),
      );
    case 'GroupBy':
      return convertExpressionMap(context, tag.values);
    case 'ArrayIndex':
      const indexParams = isArrayIndexRange(tag.index)
        ? [...convertExpression(context, tag.index.left).params, ...convertExpression(context, tag.index.right).params]
        : convertExpression(context, tag.index).params;
      return { type: 'unknown', params: convertExpression(context, tag.value).params.concat(indexParams) };
    case 'ArrayConstructor':
      return convertExpressionMap(context, tag.values);
    case 'Function':
      return {
        type: {
          type: 'function',
          name: tag.value.value.toLowerCase(),
          args: tag.args.filter(isExpression).map((arg) => convertExpression(context, arg).type),
        },
        params: tag.args
          .flatMap(
            (arg, index) =>
              convertExpression({ ...context, type: { type: 'function_arg', name: tag.value.value, index } }, arg)
                .params,
          )
          .concat(tag.filter ? convertExpression(context, tag.filter.value).params : []),
      };
    case 'Row':
      return { type: 'string', params: convertExpressionMap(context, tag.values).params };
    case 'QualifiedIdentifier':
      const lastIdentifier = last(tag.values);
      const prefixIdentifiers = initial(tag.values);

      return {
        type: lastIdentifier
          ? {
              type: 'column',
              column: lastIdentifier.value.toLowerCase(),
              ...toQualifiedTableName(prefixIdentifiers, context),
            }
          : 'unknown',
        params: [],
      };

    case 'Select':
      const select = toQueryInterface(tag);
      const selectType = select.result[0].type;

      return { type: isStarType(selectType) ? 'unknown' : selectType, params: select.params };

    case 'Null':
      return { type: 'null', params: [] };

    case 'UnaryExpression':
      const unary = convertExpression(context, tag.value);
      const unaryOperatorType = unaryTypes[tag.operator.value.toUpperCase()];
      const param = convertExpression({ ...context, type: unaryOperatorType ?? unary.type }, tag.value);

      return { type: unary.type, params: param.params };

    case 'BinaryExpression':
      const left = convertExpression(context, tag.left);
      const right = convertExpression(context, tag.right);
      const binaryOperatorType = binaryOperatorTypes[tag.operator.value.toUpperCase()];
      const paramLeft = convertExpression({ ...context, type: binaryOperatorType?.left ?? right.type }, tag.left);
      const paramRight = convertExpression({ ...context, type: binaryOperatorType?.right ?? left.type }, tag.right);
      return { type: binaryOperatorType?.result ?? left.type, params: paramLeft.params.concat(paramRight.params) };

    case 'PgCast':
    case 'Cast':
      const castType = convertType(tag.type);
      return { type: castType, params: convertExpression({ ...context, type: castType }, tag.value).params };

    case 'Case':
      return tag.values.reduce<{ type: UnionType; params: Param[] }>(
        (acc, caseTag) => {
          const caseRes = convertExpression(context, caseTag.value);
          return {
            params: isWhen(caseTag)
              ? caseRes.params.concat(convertExpression(context, caseTag.condition).params)
              : caseRes.params,
            type: { ...acc.type, items: acc.type.items.concat(caseRes.type) },
          };
        },
        { params: [], type: { type: 'union', items: [] } },
      );

    case 'Boolean':
      return { type: 'boolean', params: [] };

    case 'Number':
      return { type: 'number', params: [] };

    case 'String':
    case 'Between':
      return { type: 'string', params: [] };

    case 'Parameter':
      return {
        type: 'string',
        params: [
          {
            name: tag.value,
            type: context.type ?? 'unknown',
            required: tag.required || tag.pick.length > 0,
            pos: tag.pos,
            lastPos: tag.lastPos,
            pick: tag.pick.map((column, index) => {
              const columnType = context.insertColumns?.values[index];
              return {
                name: column.value,
                type: columnType
                  ? {
                      type: 'column',
                      column: columnType.value.toLowerCase(),
                      ...toQualifiedTableName([], context),
                    }
                  : undefined,
              };
            }),
            spread: tag.type === 'spread',
          },
        ],
      };

    case 'Distinct':
    case 'Columns':
    case 'Table':
    case 'Conflict':
      return { type: 'unknown', params: [] };
  }
};

const resolveTypeWith =
  (aliases: TableAliases) =>
  (prop: PropertyType): PropertyType =>
    isColumnType(prop) ? { ...prop, ...toName(aliases, prop) } : prop;

const resolveType = ({ aliases }: QueryContext) => {
  const resolve = resolveTypeWith(aliases);
  return (property: PropertyType): PropertyType =>
    isUnionType(property) ? { ...property, items: property.items.map(resolve) } : resolve(property);
};

const toContext = (
  from: FromListItemTag | TableTag | undefined,
  aliases: TableAliases,
  insertColumns?: ColumnsTag,
): QueryContext => {
  const fromTableExpression = from?.value;

  const fromTable: QualifiedTableName =
    fromTableExpression && isQualifiedIdentifier(fromTableExpression)
      ? toName(aliases, toQualifiedTableName(fromTableExpression.values))
      : { table: '', schema: 'public' };

  return { table: fromTable.table, schema: fromTable.schema, aliases, insertColumns };
};

const toResults = (context: QueryContext, items: Array<SelectListItemTag | ReturningListItemTag>): Result[] => {
  const resolve = resolveType(context);

  return items.map(({ value, as }) => {
    if (isStarQualifiedIdentifier(value)) {
      const lastIdentifier = last(value.values);
      const prefixIdentifiers = initial(value.values).filter(isIdentifier);

      return {
        type: lastIdentifier ? { type: 'star', ...toQualifiedTableName(prefixIdentifiers, context) } : 'unknown',
        name: '*',
      };
    } else {
      const property = convertExpression(context, value);
      const type = resolve(property.type);
      const name =
        as?.value.value ??
        (isConditionalType(type)
          ? type.name
          : isColumnType(type)
          ? type.column
          : isBoolean(value)
          ? 'bool'
          : isAnyCast(value) && isTypeArray(value.type)
          ? 'array'
          : isAnyCast(value) && isQualifiedIdentifier(value.value)
          ? last(value.value.values)?.value ?? '?column?'
          : isFunction(value)
          ? value.value.value.toLowerCase()
          : isRow(value)
          ? 'row'
          : '?column?');

      return { name, type };
    }
  });
};

const resolveParam =
  (resolve: ResolveIdentifier) =>
  (param: Param): Param => ({
    ...param,
    type: isColumnType(param.type) ? resolve(param.type) : param.type,
  });

const orderParam = orderBy<Param>((item) => (item.type === 'unknown' ? 3 : item.type === 'null' ? 2 : 1));
const uniqParam = isUnique<Param>((item) => item.name);

const resolveParams = (context: QueryContext, params: Param[]): Param[] =>
  params
    .sort(orderParam)
    .filter(uniqParam)
    .map(resolveParam(resolveType(context)));

const convertSelect = (tag: SelectTag): RawQuery => {
  const selectList = first(tag.values.filter(isSelectList));
  const from = first(tag.values.filter(isFrom));
  const context = toContext(first(from?.list.values), toTableAliases(from));

  return { context, result: selectList?.values ?? [], params: tag.values };
};

const convertCombination = (tag: CombinationTag): RawQuery => {
  const selectList = first(tag.values.filter(isSelectList));
  const from = first(tag.values.filter(isFrom));
  const context = toContext(first(from?.list.values), toTableAliases(from));

  return { context, params: tag.values, result: selectList?.values ?? [] };
};

const convertUpdate = (tag: UpdateTag): RawQuery => {
  const returningList = first(tag.values.filter(isReturning));
  const from = first(tag.values.filter(isUpdateFrom));
  const table = first(tag.values.filter(isTable));
  const context = toContext(table, toTableAliasFrom(from?.values ?? []));

  return { context, result: returningList?.values ?? [], params: tag.values };
};

const convertInsert = (tag: InsertTag): RawQuery => {
  const returningList = first(tag.values.filter(isReturning));
  const table = first(tag.values.filter(isTable));
  const insertColumns = first(tag.values.filter(isColumns));
  const context = toContext(table, toTableAliasFrom([]), insertColumns);

  return { context, result: returningList?.values ?? [], params: tag.values };
};

const convertDelete = (tag: DeleteTag): RawQuery => {
  const returningList = first(tag.values.filter(isReturning));
  const table = first(tag.values.filter(isTable));
  const using = first(tag.values.filter(isUsing));
  const context = toContext(table, toTableAliasFrom(using?.values ?? []));

  return { context, result: returningList?.values ?? [], params: tag.values };
};

const toRawQuery = (tag: SelectTag | CombinationTag | UpdateTag | InsertTag | DeleteTag): RawQuery => {
  switch (tag.tag) {
    case 'Select':
      return convertSelect(tag);
    case 'Combination':
      return convertCombination(tag);
    case 'Update':
      return convertUpdate(tag);
    case 'Insert':
      return convertInsert(tag);
    case 'Delete':
      return convertDelete(tag);
  }
};

export const toParams = (tag: SelectTag | CombinationTag | UpdateTag | InsertTag | DeleteTag): Param[] => {
  const { context, params } = toRawQuery(tag);
  return convertExpressionMap(context, params).params;
};

export const toQueryInterface = (
  tag: SelectTag | CombinationTag | UpdateTag | InsertTag | DeleteTag,
): QueryInterface => {
  const { context, result, params } = toRawQuery(tag);

  return {
    result: toResults(context, result),
    params: resolveParams(context, convertExpressionMap(context, params).params),
  };
};
