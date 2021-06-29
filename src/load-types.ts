import { ConstantType, QueryInterface } from './query-interface';

export interface LoadedProperty {
  name: string;
  type: ConstantType;
}

export interface LoadedParam {
  name: string;
  type: ConstantType;
}

export interface LoadedQueryInterface {
  params: LoadedParam[];
  result: LoadedProperty[];
}

export const loadTypes = (interface: QueryInterface): LoadedQueryInterface => {};
