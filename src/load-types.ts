import { ConstantType } from './convert';

export interface LoadedProperty {
  name: string;
  type: ConstantType;
}

export interface LoadedParam {
  name: string;
  type: ConstantType;
}

export interface QueryInterface {
  params: LoadedParam[];
  result: LoadedProperty[];
}

// export const loadTypes : ()
