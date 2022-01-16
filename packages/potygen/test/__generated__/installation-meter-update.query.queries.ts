export interface Params {
    removalDate?: Date;
    meterId?: number;
}
export interface Result {
}
export interface Query {
    params: Params;
    result: Result;
}
