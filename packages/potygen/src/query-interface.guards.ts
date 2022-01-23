import {
  TypeConstant,
  Type,
  TypeLoadArray,
  TypeArray,
  TypeBoolean,
  TypeLoadCoalesce,
  TypeDate,
  TypeJson,
  TypeLoadColumn,
  TypeLoadNamed,
  TypeBigInt,
  TypeLoadFunction,
  TypeLoadFunctionArgument,
  TypeLoadOperator,
  TypeLoadRecord,
  TypeLoadStar,
  TypeNull,
  TypeNumber,
  TypeString,
  TypeLoadUnion,
  TypeUnknown,
  TypeAny,
  TypeLoadArrayItem,
  TypeNullable,
  TypeUnion,
  TypeObjectLiteral,
  TypeLoadObjectLiteral,
  TypeLiteral,
  TypeLoadAsArray,
  TypeComposite,
  TypeLoadCompositeAccess,
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
  'Array',
  'Union',
  'LiteralNumber',
  'LiteralString',
  'LiteralBoolean',
  'Composite',
  'OptionalConstant',
];
const typeNullable = [
  'String',
  'Number',
  'BigInt',
  'Boolean',
  'Date',
  'Json',
  'Array',
  'Union',
  'Composite',
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
export const isTypeCoalesce = (type: Type): type is TypeLoadCoalesce => type.type === 'LoadCoalesce';
export const isTypeLoadRecord = (type: Type): type is TypeLoadRecord => type.type === 'LoadRecord';
export const isTypeLoadFunction = (type: Type): type is TypeLoadFunction => type.type === 'LoadFunction';
export const isTypeLoadColumn = (type: Type): type is TypeLoadColumn => type.type === 'LoadColumn';
export const isTypeLoadStar = (type: Type): type is TypeLoadStar => type.type === 'LoadStar';
export const isTypeLoadFunctionArgument = (type: Type): type is TypeLoadFunctionArgument =>
  type.type === 'LoadFunctionArgument';
export const isTypeLoadOperator = (type: Type): type is TypeLoadOperator => type.type === 'LoadOperator';
export const isTypeLoadNamed = (type: Type): type is TypeLoadNamed => type.type === 'LoadNamed';
export const isTypeLoadArray = (type: Type): type is TypeLoadArray => type.type === 'LoadArray';
export const isTypeLoadAsArray = (type: Type): type is TypeLoadAsArray => type.type === 'LoadAsArray';
export const isTypeLoadObjectLiteral = (type: Type): type is TypeLoadObjectLiteral => type.type === 'LoadObjectLiteral';
export const isTypeLoadUnion = (type: Type): type is TypeLoadUnion => type.type === 'LoadUnion';
export const isTypeArray = (type: Type): type is TypeArray => type.type === 'Array';
export const isTypeUnion = (type: Type): type is TypeUnion => type.type === 'Union';
export const isTypeObjectLiteral = (type: Type): type is TypeObjectLiteral => type.type === 'ObjectLiteral';
export const isTypeLoadArrayItem = (type: Type): type is TypeLoadArrayItem => type.type === 'LoadArrayItem';
export const isTypeComposite = (type: Type): type is TypeComposite => type.type === 'Composite';
export const isTypeLoadCompositeAccess = (type: Type): type is TypeLoadCompositeAccess =>
  type.type === 'LoadCompositeAccess';
export const isTypeOptional = (type: Type): type is TypeOptional => type.type === 'Optional';
export const isTypeOptionalConstant = (type: Type): type is TypeOptionalConstant => type.type === 'OptionalConstant';
export const isTypeLoadColumnCast = (type: Type): type is TypeLoadColumnCast => type.type === 'LoadColumnCast';

export const isTypeEqual = (a: Type, b: Type): boolean => {
  if (a.type === 'Any' || b.type === 'Any') {
    return true;
  } else if (a.type === 'Unknown' || b.type === 'Unknown') {
    return false;
  } else if ((a.type === 'LoadArray' && b.type === 'LoadArray') || (a.type === 'Array' && b.type === 'Array')) {
    return isTypeEqual(a.items, b.items);
  } else if ((a.type === 'LoadUnion' && b.type === 'LoadUnion') || (a.type === 'Union' && b.type === 'Union')) {
    return a.items.every((aItem) => b.items.some((bItem) => isTypeEqual(aItem, bItem)));
  } else if (
    (a.type === 'LoadObjectLiteral' && b.type === 'LoadObjectLiteral') ||
    (a.type === 'ObjectLiteral' && b.type === 'ObjectLiteral')
  ) {
    return a.items.every((aItem) =>
      b.items.some((bItem) => aItem.name === bItem.name && isTypeEqual(aItem.type, bItem.type)),
    );
  } else if ('literal' in a && 'literal' in b) {
    return a.type === b.type && a.literal === b.literal;
  } else if (
    (a.type === 'Optional' && b.type === 'Optional') ||
    (a.type === 'OptionalConstant' && b.type === 'OptionalConstant')
  ) {
    return isTypeEqual(a.value, b.value);
  } else {
    return a.type === b.type;
  }
};
