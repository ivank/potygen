export interface Params {
    ids?: number[];
}
export interface Result {
    id: number;
}
export interface Query {
    params: Params;
    result: Result;
}
