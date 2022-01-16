export interface Params {
    levelisationId?: number;
    start?: Date;
}
export interface Result {
    id: number;
}
export interface Query {
    params: Params;
    result: Result;
}
