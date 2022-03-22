export interface ProductsSqlParams {
    region?: string;
}
export interface ProductsSqlResult {
    product: string;
}
export interface ProductsSqlQuery {
    params: ProductsSqlParams;
    result: ProductsSqlResult;
}
