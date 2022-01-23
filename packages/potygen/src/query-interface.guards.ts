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
  TypeLoadOptional,
  TypeOptional,
  TypeLoadColumnCast,
  SourceValues,
  Source,
  SourceQuery,
  SourceTable,
  TypeName,
  LoadName,
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
  'Composite',
  'Optional',
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
  'Optional',
];
const typeLiteral = ['String', 'Number', 'Boolean', 'BigInt'];

export const isTypeConstant = (item: Type): item is TypeConstant => typeConstant.includes(item.type);
export const isTypeNullable = (item: Type): item is TypeNullable => typeNullable.includes(item.type);
export const isTypeLiteral = (item: Type): item is TypeLiteral => typeLiteral.includes(item.type);

export const isSourceTable = (item: Source): item is SourceTable => item.type === 'Table';
export const isSourceQuery = (item: Source): item is SourceQuery => item.type === 'Query';
export const isSourceValues = (item: Source): item is SourceValues => item.type === 'Values';

export const isTypeString = (type: Type): type is TypeString => type.type === TypeName.String;
export const isTypeNumber = (type: Type): type is TypeNumber => type.type === TypeName.Number;
export const isTypeBigInt = (type: Type): type is TypeBigInt => type.type === TypeName.BigInt;
export const isTypeBoolean = (type: Type): type is TypeBoolean => type.type === TypeName.Boolean;
export const isTypeDate = (type: Type): type is TypeDate => type.type === TypeName.Date;
export const isTypeNull = (type: Type): type is TypeNull => type.type === TypeName.Null;
export const isTypeJson = (type: Type): type is TypeJson => type.type === TypeName.Json;
export const isTypeUnknown = (type: Type): type is TypeUnknown => type.type === TypeName.Unknown;
export const isTypeAny = (type: Type): type is TypeAny => type.type === TypeName.Any;
export const isTypeCoalesce = (type: Type): type is TypeLoadCoalesce => type.type === LoadName.LoadCoalesce;
export const isTypeLoadRecord = (type: Type): type is TypeLoadRecord => type.type === LoadName.LoadRecord;
export const isTypeLoadFunction = (type: Type): type is TypeLoadFunction => type.type === LoadName.LoadFunction;
export const isTypeLoadColumn = (type: Type): type is TypeLoadColumn => type.type === LoadName.LoadColumn;
export const isTypeLoadStar = (type: Type): type is TypeLoadStar => type.type === LoadName.LoadStar;
export const isTypeLoadFunctionArgument = (type: Type): type is TypeLoadFunctionArgument =>
  type.type === LoadName.LoadFunctionArgument;
export const isTypeLoadOperator = (type: Type): type is TypeLoadOperator => type.type === LoadName.LoadOperator;
export const isTypeLoadNamed = (type: Type): type is TypeLoadNamed => type.type === LoadName.LoadNamed;
export const isTypeLoadArray = (type: Type): type is TypeLoadArray => type.type === LoadName.LoadArray;
export const isTypeLoadAsArray = (type: Type): type is TypeLoadAsArray => type.type === LoadName.LoadAsArray;
export const isTypeLoadObjectLiteral = (type: Type): type is TypeLoadObjectLiteral =>
  type.type === LoadName.LoadObjectLiteral;
export const isTypeLoadUnion = (type: Type): type is TypeLoadUnion => type.type === LoadName.LoadUnion;
export const isTypeArray = (type: Type): type is TypeArray => type.type === TypeName.Array;
export const isTypeUnion = (type: Type): type is TypeUnion => type.type === TypeName.Union;
export const isTypeObjectLiteral = (type: Type): type is TypeObjectLiteral => type.type === TypeName.ObjectLiteral;
export const isTypeLoadArrayItem = (type: Type): type is TypeLoadArrayItem => type.type === LoadName.LoadArrayItem;
export const isTypeComposite = (type: Type): type is TypeComposite => type.type === TypeName.Composite;
export const isTypeLoadCompositeAccess = (type: Type): type is TypeLoadCompositeAccess =>
  type.type === LoadName.LoadCompositeAccess;
export const isTypeLoadOptional = (type: Type): type is TypeLoadOptional => type.type === LoadName.LoadOptional;
export const isTypeOptional = (type: Type): type is TypeOptional => type.type === TypeName.Optional;
export const isTypeLoadColumnCast = (type: Type): type is TypeLoadColumnCast => type.type === LoadName.LoadColumnCast;

export const isTypeEqual = (a: Type, b: Type): boolean => {
  if (isTypeAny(a) || isTypeAny(b)) {
    return true;
  } else if (isTypeUnknown(a) || isTypeUnknown(b)) {
    return false;
  } else if ((isTypeLoadArray(a) && isTypeLoadArray(b)) || (isTypeArray(a) && isTypeArray(b))) {
    return isTypeEqual(a.items, b.items);
  } else if ((isTypeLoadUnion(a) && isTypeLoadUnion(b)) || (isTypeUnion(a) && isTypeUnion(b))) {
    return a.items.every((aItem) => b.items.some((bItem) => isTypeEqual(aItem, bItem)));
  } else if (
    (isTypeLoadObjectLiteral(a) && isTypeLoadObjectLiteral(b)) ||
    (isTypeObjectLiteral(a) && isTypeObjectLiteral(b))
  ) {
    return a.items.every((aItem) =>
      b.items.some((bItem) => aItem.name === bItem.name && isTypeEqual(aItem.type, bItem.type)),
    );
  } else if ('literal' in a && 'literal' in b) {
    return a.type === b.type && a.literal === b.literal;
  } else if ((isTypeLoadOptional(a) && isTypeLoadOptional(b)) || (isTypeOptional(a) && isTypeOptional(b))) {
    return isTypeEqual(a.value, b.value);
  } else {
    return a.type === b.type;
  }
};
