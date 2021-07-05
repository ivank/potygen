import { first, last, initial, isUnique, orderBy } from './util';
import {
  FromTag,
  isFrom,
  isSelectList,
  isQualifiedIdentifier,
  isIdentifier,
  isAs,
  ExpressionTag,
  isJoinOn,
  CombinationTag,
  DistinctTag,
  GroupByTag,
  HavingTag,
  LimitTag,
  OffsetTag,
  OrderByTag,
  SelectListTag,
  WhereTag,
  IdentifierTag,
  isExpression,
  isStarQualifiedIdentifier,
  isArrayIndexRange,
  TypeTag,
  TypeArrayTag,
  isBoolean,
  isAnyCast,
  isTypeArray,
  isFunction,
  isRow,
} from './sql.types';

export type ColumnType = { type: 'column'; table: string; schema: string; column: string };
export type RecordType = { type: 'record'; name: string };
export type FunctionType = { type: 'function'; name: string; args: ProperetyType[] };
export type StarType = { type: 'star'; table: string; schema: string };
export type ConstantType = 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'json' | 'unknown';
export type ArrayType = { type: 'array'; items: ConstantType | ArrayType | RecordType };
export type UnionType = { type: 'union'; items: ProperetyType[] };
export type ProperetyType = ConstantType | ColumnType | FunctionType | ArrayType | RecordType | UnionType;

export interface Result {
  name: string;
  type: ProperetyType | StarType;
}

export interface Param {
  name: string;
  type: ProperetyType;
}

export interface QueryInterface {
  params: Param[];
  result: Result[];
}

export interface QualifiedTableName {
  table: string;
  schema: string;
}

export const isColumnType = (type: ProperetyType | StarType): type is ColumnType =>
  typeof type === 'object' && 'type' in type && type.type === 'column';
export const isUnionType = (type: ProperetyType | StarType): type is UnionType =>
  typeof type === 'object' && 'type' in type && type.type === 'union';
export const isArrayType = (type: ProperetyType | StarType): type is ArrayType =>
  typeof type === 'object' && 'type' in type && type.type === 'array';
export const isStarType = (type: ProperetyType | StarType): type is StarType =>
  typeof type === 'object' && 'type' in type && type.type === 'star';

const toName = (aliases: Record<string, QualifiedTableName>, table: QualifiedTableName): QualifiedTableName =>
  aliases[table?.table ?? ''] ?? table;

const toQualifiedTableName = (
  parts: IdentifierTag[],
  context: { table?: string; schema?: string } = {},
): QualifiedTableName => ({
  table: parts[1] ? parts[1].value : parts[0]?.value ?? context.table ?? '',
  schema: parts[1] ? parts[0].value : context.schema ?? 'public',
});

const toTableAliases = (from: FromTag): Record<string, QualifiedTableName> => {
  const fromAliases = from.list.values.reduce((current, item) => {
    const alias = item.as?.value.value;
    return alias && isQualifiedIdentifier(item.value)
      ? {
          ...current,
          [alias]: toName(current, toQualifiedTableName(item.value.values)),
        }
      : current;
  }, {});

  return from.join.reduce((current, item) => {
    const alias = first(item.values.filter(isAs))?.value.value;
    return alias
      ? {
          ...current,
          [alias]: toName(current, toQualifiedTableName(item.table.values)),
        }
      : current;
  }, fromAliases);
};

const sqlTypes: { [type: string]: ConstantType } = {
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
  timetz: 'Date',
  time: 'string',
  tsquery: 'string',
  tsvector: 'string',
  txid_snapshot: 'string',
  uuid: 'string',
  xml: 'string',
};

export const toConstantType = (type?: string): ConstantType => (type ? sqlTypes[type] ?? 'string' : 'string');

const operatorTypes: { [type: string]: ConstantType } = {
  '+': 'number',
  '-': 'number',
  '/': 'number',
  '*': 'number',
  OR: 'boolean',
  AND: 'boolean',
  NOT: 'boolean',
  '||': 'string',
};

const convertType = (tag: TypeTag | TypeArrayTag): ConstantType | ArrayType | RecordType =>
  tag.tag === 'TypeArray'
    ? Array.from({ length: tag.dimensions }).reduce<ConstantType | ArrayType | RecordType>(
        (curr) => ({ type: 'array', items: curr }),
        convertType(tag.value),
      )
    : sqlTypes[tag.value] ?? { type: 'record', name: tag.value };

const convertExpression = (
  context: { type?: Param['type']; table?: string; schema?: string },
  tag: ExpressionTag | OrderByTag,
): { type: ProperetyType; params: Param[] } => {
  switch (tag.tag) {
    case 'OrderBy':
      return { type: 'unknown', params: tag.values.flatMap((item) => convertExpression(context, item.value).params) };
    case 'ArrayIndex':
      const indexParams = isArrayIndexRange(tag.index)
        ? [...convertExpression(context, tag.index.left).params, ...convertExpression(context, tag.index.right).params]
        : convertExpression(context, tag.index).params;
      return { type: 'unknown', params: convertExpression(context, tag.value).params.concat(indexParams) };
    case 'Function':
      return {
        type: {
          type: 'function',
          name: tag.value.value,
          args: tag.args.filter(isExpression).map((arg) => convertExpression(context, arg).type),
        },
        params: tag.args.flatMap((arg) => convertExpression(context, arg).params),
      };
    case 'Row':
      return { type: 'string', params: tag.values.flatMap((value) => convertExpression(context, value).params) };
    case 'QualifiedIdentifier':
      const lastIdentifier = last(tag.values);
      const prefixIdentifiers = initial(tag.values);

      return {
        type: lastIdentifier
          ? { type: 'column', column: lastIdentifier.value, ...toQualifiedTableName(prefixIdentifiers, context) }
          : 'unknown',
        params: [],
      };

    case 'Select':
      const select = convertSelect(tag);
      const selectType = select.result[0].type;

      if (isStarType(selectType)) {
        throw new Error('subquery must return only one column');
      }
      return { type: selectType, params: select.params };

    case 'Null':
      return { type: 'null', params: [] };

    case 'UnaryExpression':
      const unary = convertExpression(context, tag.value);
      const unaryOperatorType = operatorTypes[tag.operator.value.toUpperCase()];
      const param = convertExpression({ ...context, type: unaryOperatorType ?? unary.type }, tag.value);

      return { type: unary.type, params: param.params };

    case 'BinaryExpression':
      const left = convertExpression(context, tag.left);
      const right = convertExpression(context, tag.right);
      const binaryOperatorType = operatorTypes[tag.operator.value.toUpperCase()];
      const paramLeft = convertExpression({ ...context, type: binaryOperatorType ?? right.type }, tag.left);
      const paramRight = convertExpression({ ...context, type: binaryOperatorType ?? left.type }, tag.right);
      return { type: left.type, params: paramLeft.params.concat(paramRight.params) };

    case 'PgCast':
    case 'Cast':
      const castType = convertType(tag.type);
      return { type: castType, params: convertExpression({ ...context, type: castType }, tag.value).params };

    case 'Case':
      return tag.values.reduce<{ type: UnionType; params: Param[] }>(
        (acc, caseTag) => {
          const caseRes = convertExpression(context, caseTag.value);
          return {
            params: caseRes.params.concat(caseRes.params),
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
      return { type: 'string', params: [{ name: tag.value, type: context.type ?? 'unknown' }] };
  }
};

const resolveTypeWith = (aliases: Record<string, QualifiedTableName>) => (prop: ProperetyType): ProperetyType =>
  isColumnType(prop) ? { ...prop, ...toName(aliases, prop) } : prop;

const resolveType = (aliases: Record<string, QualifiedTableName>) => {
  const resolve = resolveTypeWith(aliases);
  return (property: ProperetyType): ProperetyType =>
    isUnionType(property) ? { ...property, items: property.items.map(resolve) } : resolve(property);
};

export const convertSelect = (selectTag: {
  tag: 'Combination' | 'Select';
  values: (
    | DistinctTag
    | SelectListTag
    | FromTag
    | WhereTag
    | GroupByTag
    | HavingTag
    | OrderByTag
    | CombinationTag
    | LimitTag
    | OffsetTag
  )[];
}): QueryInterface => {
  const selectList = first(selectTag.values.filter(isSelectList));
  const from = first(selectTag.values.filter(isFrom));
  const tableAliases = from ? toTableAliases(from) : {};

  const fromTableExpression = first(from?.list.values)?.value;

  const fromTable: QualifiedTableName =
    fromTableExpression && isQualifiedIdentifier(fromTableExpression)
      ? toName(tableAliases, toQualifiedTableName(fromTableExpression.values))
      : { table: '', schema: 'public' };

  const resolve = resolveType(tableAliases);

  const context = { table: fromTable.table, schema: fromTable.schema };

  const result: Result[] =
    selectList?.values.map(({ value, as }) => {
      if (isStarQualifiedIdentifier(value)) {
        const lastIdentifier = last(value.values);
        const prefixIdentifiers = initial(value.values).filter(isIdentifier);

        return {
          type: lastIdentifier ? { type: 'star', ...toQualifiedTableName(prefixIdentifiers) } : 'unknown',
          name: '*',
        };
      } else {
        const property = convertExpression(context, value);
        const type = resolve(property.type);
        const name =
          as?.value.value ??
          (isColumnType(type)
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
    }) ?? [];

  const params: Param[] = selectTag.values
    .reduce<Param[]>((current, tag) => {
      switch (tag.tag) {
        case 'SelectList':
          return current.concat(
            tag.values.flatMap((item) =>
              isStarQualifiedIdentifier(item.value) ? [] : convertExpression(context, item.value).params,
            ),
          );
        case 'From':
          return current.concat(
            tag.join.flatMap((item) =>
              item.values.filter(isJoinOn).flatMap((join) => convertExpression(context, join.value).params),
            ),
          );
        case 'Where':
        case 'Having':
          return current.concat(convertExpression(context, tag.value).params);
        case 'OrderBy':
          return current.concat(convertExpression(context, tag).params);
        case 'Limit':
        case 'Offset':
          return typeof tag.value.value === 'string'
            ? current
            : current.concat(convertExpression({ ...context, type: 'string' }, tag.value.value).params);
        case 'Combination':
          return current.concat(convertSelect(tag).params);
        default:
          return current;
      }
    }, [])
    .sort(orderBy((item) => (item.type === 'unknown' ? 3 : item.type === 'null' ? 2 : 1)))
    .filter(isUnique((item) => item.name))
    .map((param) => ({ ...param, type: resolve(param.type) }));

  return { params, result };
};
