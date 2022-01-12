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
  TypeBigInt,
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
  TypeNullable,
  TypeUnionConstant,
  TypeObjectLiteralConstant,
  TypeObjectLiteral,
  TypeLiteral,
  TypeToArray,
  TypeCompositeConstant,
  TypeCompositeAccess,
  TypeOptional,
  TypeOptionalConstant,
  TypeLoadColumnCast,
  SourceValues,
  Source,
  SourceQuery,
  SourceTable,
} from './query-interface.types';

const typeConstant = [
  'String',
  'Number',
  'BigInt',
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
  'CompositeConstant',
  'OptionalConstant',
];
const typeNullable = [
  'String',
  'Number',
  'BigInt',
  'Boolean',
  'Date',
  'Json',
  'ArrayConstant',
  'UnionConstant',
  'CompositeConstant',
  'OptionalConstant',
];
const typeLiteral = ['String', 'Number', 'Boolean', 'BigInt'];

export const isTypeConstant = (item: Type): item is TypeConstant => typeConstant.includes(item.type);
export const isTypeNullable = (item: Type): item is TypeNullable => typeNullable.includes(item.type);
export const isTypeLiteral = (item: Type): item is TypeLiteral => typeLiteral.includes(item.type);

export const isSourceTable = (item: Source): item is SourceTable => item.type === 'Table';
export const isSourceQuery = (item: Source): item is SourceQuery => item.type === 'Query';
export const isSourceValues = (item: Source): item is SourceValues => item.type === 'Values';

export const isTypeString = (type: Type): type is TypeString => type.type === 'String';
export const isTypeNumber = (type: Type): type is TypeNumber => type.type === 'Number';
export const isTypeBigInt = (type: Type): type is TypeBigInt => type.type === 'BigInt';
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
export const isTypeToArray = (type: Type): type is TypeToArray => type.type === 'ToArray';
export const isTypeObjectLiteral = (type: Type): type is TypeObjectLiteral => type.type === 'ObjectLiteral';
export const isTypeUnion = (type: Type): type is TypeUnion => type.type === 'Union';
export const isTypeArrayConstant = (type: Type): type is TypeArrayConstant => type.type === 'ArrayConstant';
export const isTypeUnionConstant = (type: Type): type is TypeUnionConstant => type.type === 'UnionConstant';
export const isTypeObjectLiteralConstant = (type: Type): type is TypeObjectLiteralConstant =>
  type.type === 'ObjectLiteralConstant';
export const isTypeArrayItem = (type: Type): type is TypeArrayItem => type.type === 'ArrayItem';
export const isTypeCompositeConstant = (type: Type): type is TypeCompositeConstant => type.type === 'CompositeConstant';
export const isTypeCompositeAccess = (type: Type): type is TypeCompositeAccess => type.type === 'CompositeAccess';
export const isTypeOptional = (type: Type): type is TypeOptional => type.type === 'Optional';
export const isTypeOptionalConstant = (type: Type): type is TypeOptionalConstant => type.type === 'OptionalConstant';
export const isTypeLoadColumnCast = (type: Type): type is TypeLoadColumnCast => type.type === 'LoadColumnCast';
