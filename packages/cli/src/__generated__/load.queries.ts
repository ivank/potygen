export interface TablesSqlParams {
    tableNames: {
        schema: unknown;
        name: unknown;
    }[];
}
export interface TablesSqlResult {
    type: "Table";
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
export interface TableEnumsSqlParams {
    tableNames: {
        schema: unknown;
        name: unknown;
    }[];
}
export interface TableEnumsSqlResult {
    type: "Enum";
    name: string;
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
    type: "Enum";
    name: string;
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
    type: "Function";
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
