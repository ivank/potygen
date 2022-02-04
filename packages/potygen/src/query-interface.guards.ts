import {
  Type,
  TypeOrLoad,
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
  TypeLoad,
} from './query-interface.types';

export const isType = (item: TypeOrLoad): item is Type =>
  item.type === TypeName.String ||
  item.type === TypeName.Number ||
  item.type === TypeName.BigInt ||
  item.type === TypeName.Boolean ||
  item.type === TypeName.Date ||
  item.type === TypeName.Null ||
  item.type === TypeName.Json ||
  item.type === TypeName.Unknown ||
  item.type === TypeName.Any ||
  item.type === TypeName.Array ||
  item.type === TypeName.Union ||
  item.type === TypeName.Composite ||
  item.type === TypeName.Optional;

export const isTypeLoad = (item: TypeOrLoad): item is TypeLoad =>
  item.type === TypeName.LoadOptional ||
  item.type === TypeName.LoadColumn ||
  item.type === TypeName.LoadFunction ||
  item.type === TypeName.LoadFunctionArgument ||
  item.type === TypeName.LoadRecord ||
  item.type === TypeName.LoadStar ||
  item.type === TypeName.LoadOperator ||
  item.type === TypeName.LoadNamed ||
  item.type === TypeName.LoadCoalesce ||
  item.type === TypeName.LoadArray ||
  item.type === TypeName.LoadAsArray ||
  item.type === TypeName.LoadArrayItem ||
  item.type === TypeName.LoadCompositeAccess ||
  item.type === TypeName.LoadUnion ||
  item.type === TypeName.LoadColumnCast ||
  item.type === TypeName.LoadObjectLiteral;

export const isTypeNullable = (item: TypeOrLoad): item is TypeNullable =>
  item.type === TypeName.String ||
  item.type === TypeName.Number ||
  item.type === TypeName.BigInt ||
  item.type === TypeName.Boolean ||
  item.type === TypeName.Date ||
  item.type === TypeName.Json ||
  item.type === TypeName.Array ||
  item.type === TypeName.Union ||
  item.type === TypeName.Composite ||
  item.type === TypeName.Optional;

export const isTypeLiteral = (item: TypeOrLoad): item is TypeLiteral =>
  item.type === TypeName.String ||
  item.type === TypeName.Number ||
  item.type === TypeName.Boolean ||
  item.type === TypeName.BigInt;

export const isSourceTable = (item: Source): item is SourceTable => item.type === 'Table';
export const isSourceQuery = (item: Source): item is SourceQuery => item.type === 'Query';
export const isSourceValues = (item: Source): item is SourceValues => item.type === 'Values';

export const isTypeString = (type: TypeOrLoad): type is TypeString => type.type === TypeName.String;
export const isTypeNumber = (type: TypeOrLoad): type is TypeNumber => type.type === TypeName.Number;
export const isTypeBigInt = (type: TypeOrLoad): type is TypeBigInt => type.type === TypeName.BigInt;
export const isTypeBoolean = (type: TypeOrLoad): type is TypeBoolean => type.type === TypeName.Boolean;
export const isTypeDate = (type: TypeOrLoad): type is TypeDate => type.type === TypeName.Date;
export const isTypeNull = (type: TypeOrLoad): type is TypeNull => type.type === TypeName.Null;
export const isTypeJson = (type: TypeOrLoad): type is TypeJson => type.type === TypeName.Json;
export const isTypeUnknown = (type: TypeOrLoad): type is TypeUnknown => type.type === TypeName.Unknown;
export const isTypeAny = (type: TypeOrLoad): type is TypeAny => type.type === TypeName.Any;
export const isTypeCoalesce = (type: TypeOrLoad): type is TypeLoadCoalesce => type.type === TypeName.LoadCoalesce;
export const isTypeLoadRecord = (type: TypeOrLoad): type is TypeLoadRecord => type.type === TypeName.LoadRecord;
export const isTypeLoadFunction = (type: TypeOrLoad): type is TypeLoadFunction => type.type === TypeName.LoadFunction;
export const isTypeLoadColumn = (type: TypeOrLoad): type is TypeLoadColumn => type.type === TypeName.LoadColumn;
export const isTypeLoadStar = (type: TypeOrLoad): type is TypeLoadStar => type.type === TypeName.LoadStar;
export const isTypeLoadFunctionArgument = (type: TypeOrLoad): type is TypeLoadFunctionArgument =>
  type.type === TypeName.LoadFunctionArgument;
export const isTypeLoadOperator = (type: TypeOrLoad): type is TypeLoadOperator => type.type === TypeName.LoadOperator;
export const isTypeLoadNamed = (type: TypeOrLoad): type is TypeLoadNamed => type.type === TypeName.LoadNamed;
export const isTypeLoadArray = (type: TypeOrLoad): type is TypeLoadArray => type.type === TypeName.LoadArray;
export const isTypeLoadAsArray = (type: TypeOrLoad): type is TypeLoadAsArray => type.type === TypeName.LoadAsArray;
export const isTypeLoadObjectLiteral = (type: TypeOrLoad): type is TypeLoadObjectLiteral =>
  type.type === TypeName.LoadObjectLiteral;
export const isTypeLoadUnion = (type: TypeOrLoad): type is TypeLoadUnion => type.type === TypeName.LoadUnion;
export const isTypeArray = (type: TypeOrLoad): type is TypeArray => type.type === TypeName.Array;
export const isTypeUnion = (type: TypeOrLoad): type is TypeUnion => type.type === TypeName.Union;
export const isTypeObjectLiteral = (type: TypeOrLoad): type is TypeObjectLiteral =>
  type.type === TypeName.ObjectLiteral;
export const isTypeLoadArrayItem = (type: TypeOrLoad): type is TypeLoadArrayItem =>
  type.type === TypeName.LoadArrayItem;
export const isTypeComposite = (type: TypeOrLoad): type is TypeComposite => type.type === TypeName.Composite;
export const isTypeLoadCompositeAccess = (type: TypeOrLoad): type is TypeLoadCompositeAccess =>
  type.type === TypeName.LoadCompositeAccess;
export const isTypeLoadOptional = (type: TypeOrLoad): type is TypeLoadOptional => type.type === TypeName.LoadOptional;
export const isTypeOptional = (type: TypeOrLoad): type is TypeOptional => type.type === TypeName.Optional;
export const isTypeLoadColumnCast = (type: TypeOrLoad): type is TypeLoadColumnCast =>
  type.type === TypeName.LoadColumnCast;

export const isTypeEqual = (a: TypeOrLoad, b: TypeOrLoad): boolean => {
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
