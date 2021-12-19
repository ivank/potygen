export interface TablesSqlParams {
  tableNames: {
    schema: unknown;
    name: unknown;
  }[];
}
export interface TablesSqlResult {
  type: 'Table';
  name: {
    schema: string;
    name: string;
  };
  columns: {
    name: string;
    isNullable: string;
    enum: string;
    type: string;
  }[];
}
export interface TablesSqlQuery {
  params: TablesSqlParams;
  result: TablesSqlResult;
}
export interface CompositesSqlParams {
  compositeNames: {
    schema: unknown;
    name: unknown;
  }[];
}
export interface CompositesSqlResult {
  type: 'Composite';
  name: {
    schema: string;
    name: string;
  };
  attributes: {
    name: string;
    isNullable: string;
    type: string;
  }[];
}
export interface CompositesSqlQuery {
  params: CompositesSqlParams;
  result: CompositesSqlResult;
}
export interface TableCompositesSqlParams {
  tableNames: {
    schema: unknown;
    name: unknown;
  }[];
}
export interface TableCompositesSqlResult {
  type: 'Composite';
  name: {
    schema: string;
    name: string;
  };
  attributes: {
    name: string;
    isNullable: string;
    type: string;
  }[];
}
export interface TableCompositesSqlQuery {
  params: TableCompositesSqlParams;
  result: TableCompositesSqlResult;
}
export interface ViewsSqlParams {
  tableNames: {
    schema: unknown;
    name: unknown;
  }[];
}
export interface ViewsSqlResult {
  type: 'View';
  name: {
    schema: string;
    name: string;
  };
  definition: string;
}
export interface ViewsSqlQuery {
  params: ViewsSqlParams;
  result: ViewsSqlResult;
}
export interface TableEnumsSqlParams {
  tableNames: {
    schema: unknown;
    name: unknown;
  }[];
}
export interface TableEnumsSqlResult {
  type: 'Enum';
  name: {
    schema: string;
    name: string;
  };
  enum: string[];
}
export interface TableEnumsSqlQuery {
  params: TableEnumsSqlParams;
  result: TableEnumsSqlResult;
}
export interface EnumsSqlParams {
  enumNames: string[];
}
export interface EnumsSqlResult {
  type: 'Enum';
  name: {
    schema: string;
    name: string;
  };
  enum: string[];
}
export interface EnumsSqlQuery {
  params: EnumsSqlParams;
  result: EnumsSqlResult;
}
export interface FunctionsSqlParams {
  functionNames: string[];
}
export interface FunctionsSqlResult {
  type: 'Function';
  schema?: string;
  name: string;
  returnType: string;
  isAggregate: boolean;
  argTypes: string[];
}
export interface FunctionsSqlQuery {
  params: FunctionsSqlParams;
  result: FunctionsSqlResult;
}
