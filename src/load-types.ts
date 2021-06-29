import { ConstantType, QueryInterface, isColumnType } from './query-interface';

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

const getColumnsAndTables = (query: QueryInterface) => {
  query.params.flatMap(param => {
    if (isColumnType(param.type)) {
      const [schema, table] = param.type.table;
      return table ? `${schema}.${table}.${param.type.column}` : `${schema}.${param.type.column}`;
    }
  })
}

export const loadTypes = (query: QueryInterface): LoadedQueryInterface => {
  query.params.map(param => {
    if (isColumnType(param.type)) {
      param.type.
    }
  })
};
