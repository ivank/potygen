export interface Params {
    q?: string;
    ids?: number[];
}
export interface Result {
    total: number;
}
export interface Query {
    params: Params;
    result: Result;
}
