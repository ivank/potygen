import {
  ConditionalType,
  UnionType,
  LiteralType,
  PropertyType,
  StarType,
  FunctionArgType,
  ConstantType,
  ColumnType,
  FunctionType,
  RecordType,
  ArrayType,
} from './query-interface.types';

export const isConstantType = (type: PropertyType | StarType | FunctionArgType): type is ConstantType =>
  !(typeof type === 'object' && 'type' in type);

export const isNullType = (type: PropertyType | StarType | FunctionArgType): type is 'null' => type === 'null';
export const isColumnType = (type: PropertyType | StarType | FunctionArgType): type is ColumnType =>
  !isConstantType(type) && type.type === 'column';
export const isFunctionType = (type: PropertyType | StarType | FunctionArgType): type is FunctionType =>
  !isConstantType(type) && type.type === 'function';
export const isConditionalType = (type: PropertyType | StarType | FunctionArgType): type is ConditionalType =>
  !isConstantType(type) && type.type === 'conditional';
export const isRecordType = (type: PropertyType | StarType | FunctionArgType): type is RecordType =>
  !isConstantType(type) && type.type === 'record';
export const isFunctionArgType = (type: PropertyType | StarType | FunctionArgType): type is FunctionArgType =>
  !isConstantType(type) && type.type === 'function_arg';
export const isUnionType = (type: PropertyType | StarType | FunctionArgType): type is UnionType =>
  !isConstantType(type) && type.type === 'union';
export const isArrayType = (type: PropertyType | StarType | FunctionArgType): type is ArrayType =>
  !isConstantType(type) && type.type === 'array';
export const isLiteralType = (type: PropertyType | StarType | FunctionArgType): type is LiteralType =>
  !isConstantType(type) && type.type === 'literal';
export const isStarType = (type: PropertyType | StarType | FunctionArgType): type is StarType =>
  !isConstantType(type) && type.type === 'star';
