import {
  TypeConstant,
  Type,
  TypeArray,
  TypeArrayConstant,
  TypeBoolean,
  TypeCoalesce,
  TypeDate,
  TypeJson,
  TypeLoadColumn,
  TypeNamed,
  TypeLoadFunction,
  TypeLoadFunctionArgument,
  TypeLoadOperator,
  TypeLoadRecord,
  TypeLoadStar,
  TypeNull,
  TypeNumber,
  TypeString,
  TypeUnion,
  TypeUnknown,
  TypeAny,
  TypeArrayItem,
  TypeOptional,
  TypeUnionConstant,
  TypeObjectLiteralConstant,
  TypeObjectLiteral,
  TypeLiteral,
} from './query-interface.types';

const typeConstant = [
  'String',
  'Number',
  'Boolean',
  'Date',
  'Null',
  'Json',
  'Unknown',
  'Any',
  'ArrayConstant',
  'UnionConstant',
  'LiteralNumber',
  'LiteralString',
  'LiteralBoolean',
];
const typeOptional = ['String', 'Number', 'Boolean', 'Date', 'Json', 'ArrayConstant', 'UnionConstant'];
const typeLiteral = ['String', 'Number', 'Boolean'];

export const isTypeConstant = (item: Type): item is TypeConstant => typeConstant.includes(item.type);
export const isTypeOptional = (item: Type): item is TypeOptional => typeOptional.includes(item.type);
export const isTypeLiteral = (item: Type): item is TypeLiteral => typeLiteral.includes(item.type);

export const isTypeString = (type: Type): type is TypeString => type.type === 'String';
export const isTypeNumber = (type: Type): type is TypeNumber => type.type === 'Number';
export const isTypeBoolean = (type: Type): type is TypeBoolean => type.type === 'Boolean';
export const isTypeDate = (type: Type): type is TypeDate => type.type === 'Date';
export const isTypeNull = (type: Type): type is TypeNull => type.type === 'Null';
export const isTypeJson = (type: Type): type is TypeJson => type.type === 'Json';
export const isTypeUnknown = (type: Type): type is TypeUnknown => type.type === 'Unknown';
export const isTypeAny = (type: Type): type is TypeAny => type.type === 'Any';
export const isTypeCoalesce = (type: Type): type is TypeCoalesce => type.type === 'Coalesce';
export const isTypeLoadRecord = (type: Type): type is TypeLoadRecord => type.type === 'LoadRecord';
export const isTypeLoadFunction = (type: Type): type is TypeLoadFunction => type.type === 'LoadFunction';
export const isTypeLoadColumn = (type: Type): type is TypeLoadColumn => type.type === 'LoadColumn';
export const isTypeLoadStar = (type: Type): type is TypeLoadStar => type.type === 'LoadStar';
export const isTypeLoadFunctionArgument = (type: Type): type is TypeLoadFunctionArgument =>
  type.type === 'LoadFunctionArgument';
export const isTypeLoadOperator = (type: Type): type is TypeLoadOperator => type.type === 'LoadOperator';
export const isTypeNamed = (type: Type): type is TypeNamed => type.type === 'Named';
export const isTypeArray = (type: Type): type is TypeArray => type.type === 'Array';
export const isTypeObjectLiteral = (type: Type): type is TypeObjectLiteral => type.type === 'ObjectLiteral';
export const isTypeUnion = (type: Type): type is TypeUnion => type.type === 'Union';
export const isTypeArrayConstant = (type: Type): type is TypeArrayConstant => type.type === 'ArrayConstant';
export const isTypeUnionConstant = (type: Type): type is TypeUnionConstant => type.type === 'UnionConstant';
export const isTypeObjectLiteralConstant = (type: Type): type is TypeObjectLiteralConstant =>
  type.type === 'ObjectLiteralConstant';
export const isTypeArrayItem = (type: Type): type is TypeArrayItem => type.type === 'ArrayItem';