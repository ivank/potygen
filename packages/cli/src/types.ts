export type LoadedUnion = { type: 'union'; items: LoadedType[]; optional?: boolean };
export type LoadedArray = { type: 'array'; items: LoadedType; optional?: boolean };
export type LoadedLiteral = { type: 'literal'; value: string; optional?: boolean };
export type LoadedConstant = {
  type: 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'json' | 'unknown';
  optional?: boolean;
};
export type LoadedValuesPick = { type: 'pick'; items: Array<{ name: string; value: LoadedType }>; optional?: boolean };
export type LoadedType = LoadedUnion | LoadedArray | LoadedLiteral | LoadedConstant;

export interface LoadedResult {
  name: string;
  type: LoadedType;
}

export interface LoadedParam {
  name: string;
  type: LoadedType | LoadedValuesPick;
}

export interface LoadedQuery {
  params: LoadedParam[];
  result: LoadedResult[];
}
