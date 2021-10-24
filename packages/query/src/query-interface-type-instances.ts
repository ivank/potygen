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
} from './query-interface.types';

export const typeJson: TypeJson = { type: 'Json' };
export const typeNull: TypeNull = { type: 'Null' };
export const typeUnknown: TypeUnknown = { type: 'Unknown' };
export const typeAny: TypeAny = { type: 'Any' };
export const typeString: TypeString = { type: 'String' };
export const typeBoolean: TypeBoolean = { type: 'Boolean' };
export const typeNumber: TypeNumber = { type: 'Number' };
export const typeDate: TypeDate = { type: 'Date' };
export const typeArrayString: TypeArrayConstant = { type: 'ArrayConstant', items: { type: 'String' } };
export const typeArrayNumber: TypeArrayConstant = { type: 'ArrayConstant', items: { type: 'Number' } };
export const typeArrayAny: TypeArrayConstant = { type: 'ArrayConstant', items: { type: 'Any' } };

export const sqlTypes: Record<string, TypeConstant> = {
  anyarray: typeArrayAny,
  anynonarray: typeAny,
  anyelement: typeAny,
  '"any"': typeAny,
  regconfig: typeString,
  bigint: typeString,
  int8: typeString,
  bigserial: typeString,
  serial8: typeString,
  'bit varying': typeString,
  varbit: typeString,
  bit: typeString,
  boolean: typeBoolean,
  bool: typeBoolean,
  box: typeString,
  bytea: typeString,
  'character varying': typeString,
  varchar: typeString,
  character: typeString,
  char: typeString,
  cidr: typeString,
  circle: typeString,
  date: typeDate,
  'double precision': typeString,
  float8: typeString,
  inet: typeString,
  integer: typeNumber,
  int4: typeNumber,
  int: typeNumber,
  interval: typeString,
  jsonb: typeJson,
  json: typeJson,
  line: typeString,
  lseg: typeString,
  macaddr: typeString,
  money: typeString,
  numeric: typeString,
  decimal: typeString,
  path: typeString,
  pg_lsn: typeString,
  point: typeString,
  polygon: typeString,
  real: typeString,
  float: typeNumber,
  float4: typeNumber,
  smallint: typeNumber,
  int2: typeNumber,
  smallserial: typeNumber,
  serial2: typeNumber,
  serial4: typeNumber,
  serial: typeNumber,
  text: typeString,
  timestamptz: typeDate,
  timestamp: typeDate,
  'timestamp without time zone': typeDate,
  'timestamp with time zone': typeDate,
  'time without time zone': typeString,
  'time with time zone': typeString,
  timetz: typeDate,
  time: typeString,
  tsquery: typeString,
  tsvector: typeString,
  txid_snapshot: typeString,
  uuid: typeString,
  xml: typeString,
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
    [typeJson, typeArrayString, typeJson],
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
  '#>': [[typeJson, typeArrayString, typeJson]],
  '#-': [[typeJson, typeArrayString, typeJson]],
  '#>>': [[typeJson, typeArrayString, typeString]],
  '?': [[typeJson, typeString, typeBoolean]],
  '?|': [[typeJson, typeArrayString, typeBoolean]],
  '?&': [[typeJson, typeArrayString, typeBoolean]],
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
};
