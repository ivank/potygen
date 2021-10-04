import { LoadedType, LoadedUnion, LoadedValuesPick, LoadedArray, LoadedLiteral, LoadedConstant } from './types';

export const isLoadedUnionType = (type: LoadedType): type is LoadedUnion => type.type === 'union';
export const isLoadedValuesPick = (type: LoadedType | LoadedValuesPick): type is LoadedValuesPick =>
  type.type === 'pick';
export const isLoadedArrayType = (type: LoadedType): type is LoadedArray => type.type === 'array';
export const isLoadedLiteralType = (type: LoadedType): type is LoadedLiteral => type.type === 'literal';
export const isLoadedConstantType = (type: LoadedType): type is LoadedConstant =>
  ['string', 'number', 'boolean', 'Date', 'null', 'json', 'unknown'].includes(type.type);
