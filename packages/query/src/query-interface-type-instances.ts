import { UnaryOperatorTag, BinaryOperatorTag } from '@psql-ts/ast';
import {
  TypeJson,
  TypeNull,
  TypeUnknown,
  TypeString,
  TypeBoolean,
  TypeNumber,
  TypeDate,
  TypeArrayConstant,
  TypeConstant,
  TypeAny,
  TypeBuffer,
} from './query-interface.types';

export const typeJson: TypeJson = { type: 'Json' };
export const typeNull: TypeNull = { type: 'Null' };
export const typeUnknown: TypeUnknown = { type: 'Unknown' };
export const typeAny: TypeAny = { type: 'Any' };
export const typeString: TypeString = { type: 'String' };
export const typeBuffer: TypeBuffer = { type: 'Buffer' };
export const typeBoolean: TypeBoolean = { type: 'Boolean' };
export const typeNumber: TypeNumber = { type: 'Number' };
export const typeDate: TypeDate = { type: 'Date' };

const arr = (items: TypeConstant): TypeArrayConstant => ({ type: 'ArrayConstant', items });

export const pgTypeAliases: Record<string, string> = {
  bigint: 'int8',
  bigserial: 'serial8',
  'bit varying': 'varbit',
  boolean: 'bool',
  character: 'char',
  'character varying': 'varchar',
  'double precision': 'float8',
  integer: 'int4',
  int: 'int4',
  numeric: 'decimal',
  real: 'float4',
  smallint: 'int2',
  smallserial: 'serial2',
  serial: 'serial4',
  'time with time zone': 'timetz',
  'time without time zone': 'time',
  'timestamp without time zone': 'timestamp',
  'timestamp with time zone': 'timestamptz',
};

export const pgTypes: { [key: string]: TypeConstant } = {
  aclitem: typeString,
  cid: typeString,
  macaddr: typeString,
  macaddr8: typeString,
  pg_lsn: typeString,
  smgr: typeString,
  tid: typeString,
  uuid: typeString,
  xid: typeString,
  interval: {
    type: 'ObjectLiteralConstant',
    items: [
      { name: 'years', type: typeNumber },
      { name: 'months', type: typeNumber },
      { name: 'days', type: typeNumber },
      { name: 'hours', type: typeNumber },
      { name: 'minutes', type: typeNumber },
      { name: 'seconds', type: typeNumber },
      { name: 'milliseconds', type: typeNumber },
    ],
  },
  bytea: typeBuffer,
  reltime: typeString,
  tinterval: typeString,
  char: typeString,
  cstring: typeString,
  daterange: typeString,
  decimal: typeString,
  name: typeString,
  any: typeAny,
  anyelement: arr(typeString),
  anyenum: arr(typeString),
  anynonarray: typeAny,
  anyarray: arr(typeAny),
  anyrange: arr(typeString),
  event_trigger: typeString,
  fdw_handler: typeString,
  index_am_handler: typeString,
  internal: typeString,
  language_handler: typeString,
  opaque: typeString,
  pg_ddl_command: typeString,
  trigger: typeString,
  tsm_handler: typeString,
  bit: typeString,
  bpchar: typeString,
  cidr: typeString,
  inet: typeString,
  void: typeString,
  float4: typeNumber,
  float8: typeString,
  int2vector: typeString,
  int4range: typeString,
  int2: typeNumber,
  int4: typeNumber,
  int8range: typeString,
  int8: typeString,
  money: typeString,
  numeric: typeString,
  jsonb: typeJson,
  json: typeJson,
  oid: typeNumber,
  regclass: typeString,
  regconfig: typeString,
  regdictionary: typeString,
  regnamespace: typeString,
  regoper: typeString,
  regoperator: typeString,
  regproc: typeString,
  regprocedure: typeString,
  regrole: typeString,
  regtype: typeString,
  box: typeString,
  path: typeString,
  polygon: typeString,
  circle: {
    type: 'ObjectLiteralConstant',
    items: [
      { name: 'x', type: typeNumber },
      { name: 'y', type: typeNumber },
      { name: 'radius', type: typeNumber },
    ],
  },
  line: typeString,
  lseg: typeString,
  point: {
    type: 'ObjectLiteralConstant',
    items: [
      { name: 'x', type: typeNumber },
      { name: 'y', type: typeNumber },
    ],
  },
  abstime: typeString,
  date: typeDate,
  time: typeString,
  timestamp: typeDate,
  timestamptz: typeDate,
  timetz: typeDate,
  bool: typeBoolean,
  tsrange: typeString,
  numrange: typeString,
  tstzrange: typeString,
  oidvector: typeString,
  record: typeString,
  refcursor: typeString,
  text: typeString,
  tsquery: typeString,
  tsvector: typeString,
  txid_snapshot: typeString,
  unknown: typeUnknown,
  varbit: typeString,
  varchar: typeString,
  xml: typeString,

  // Weird types
  null: typeNull,
  '"any"': typeAny,
};

export const unaryOperatorTypes: { [type in UnaryOperatorTag['value']]: TypeConstant } = {
  '+': typeNumber,
  '-': typeNumber,
  NOT: typeBoolean,
  ISNULL: typeBoolean,
  NOTNULL: typeBoolean,
};

export const binaryOperatorTypes: {
  [type in BinaryOperatorTag['value']]: Array<[TypeConstant, TypeConstant, TypeConstant]>;
} = {
  '^': [[typeNumber, typeNumber, typeNumber]],
  '%': [[typeNumber, typeNumber, typeNumber]],
  '+': [
    [typeNumber, typeNumber, typeNumber],
    [typeDate, typeString, typeDate],
  ],
  '-': [
    [typeNumber, typeNumber, typeNumber],
    [typeJson, typeString, typeJson],
    [typeJson, arr(typeString), typeJson],
    [typeDate, typeString, typeDate],
    [typeDate, typeDate, typeDate],
  ],
  '/': [[typeNumber, typeNumber, typeNumber]],
  '*': [
    [typeNumber, typeNumber, typeNumber],
    [typeNumber, typeString, typeString],
    [typeDate, typeString, typeDate],
  ],
  OR: [[typeAny, typeAny, typeBoolean]],
  AND: [[typeAny, typeAny, typeBoolean]],
  '||': [
    [typeString, typeString, typeString],
    [typeJson, typeJson, typeJson],
  ],
  '>=': [
    [typeBoolean, typeBoolean, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeNumber, typeNumber, typeBoolean],
  ],
  '<=': [
    [typeBoolean, typeBoolean, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeNumber, typeNumber, typeBoolean],
  ],
  '>': [
    [typeBoolean, typeBoolean, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeNumber, typeNumber, typeBoolean],
  ],
  '<': [
    [typeBoolean, typeBoolean, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeNumber, typeNumber, typeBoolean],
  ],
  '=': [
    [typeNumber, typeNumber, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeString, typeString, typeBoolean],
    [typeBoolean, typeBoolean, typeBoolean],
    [typeJson, typeJson, typeBoolean],
  ],
  '!=': [
    [typeNumber, typeNumber, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeString, typeString, typeBoolean],
    [typeBoolean, typeBoolean, typeBoolean],
    [typeJson, typeJson, typeBoolean],
  ],
  '<>': [
    [typeNumber, typeNumber, typeBoolean],
    [typeDate, typeDate, typeBoolean],
    [typeString, typeString, typeBoolean],
    [typeBoolean, typeBoolean, typeBoolean],
    [typeJson, typeJson, typeBoolean],
  ],
  IN: [[typeAny, typeAny, typeBoolean]],
  '@@': [[typeString, typeString, typeBoolean]],
  LIKE: [[typeString, typeString, typeBoolean]],
  ILIKE: [[typeString, typeString, typeBoolean]],
  IS: [[typeAny, typeAny, typeBoolean]],
  '->': [
    [typeJson, typeNumber, typeJson],
    [typeJson, typeString, typeJson],
  ],
  '->>': [
    [typeJson, typeNumber, typeString],
    [typeJson, typeString, typeString],
  ],
  '#>': [[typeJson, arr(typeString), typeJson]],
  '#-': [[typeJson, arr(typeString), typeJson]],
  '#>>': [[typeJson, arr(typeString), typeString]],
  '?': [[typeJson, typeString, typeBoolean]],
  '?|': [[typeJson, arr(typeString), typeBoolean]],
  '?&': [[typeJson, arr(typeString), typeBoolean]],
  '@>': [
    [typeString, typeString, typeBoolean],
    [typeJson, typeJson, typeBoolean],
  ],
  '<->': [[typeString, typeString, typeString]],
  '<@': [
    [typeString, typeString, typeBoolean],
    [typeJson, typeJson, typeBoolean],
  ],
  '|': [
    [typeJson, typeJson, typeBoolean],
    [typeString, typeString, typeString],
  ],
  '&': [[typeString, typeString, typeString]],
  '#': [[typeString, typeString, typeString]],
  '~': [[typeString, typeString, typeString]],
  '<<': [[typeString, typeNumber, typeString]],
  '>>': [[typeString, typeNumber, typeString]],
  OVERLAPS: [[typeAny, typeAny, typeBoolean]],
  'AT TIME ZONE': [
    [typeDate, typeString, typeDate],
    [typeAny, typeString, typeDate],
  ],
  'IS DISTINCT FROM': [[typeAny, typeAny, typeBoolean]],
  'IS NOT DISTINCT FROM': [[typeAny, typeAny, typeBoolean]],
};

export interface TypeSpreadConstant {
  type: 'SpreadConstant';
  items: TypeConstant;
}
