export interface Params {
    isAccepted?: boolean;
    id?: number;
}
export interface Result {
    id: number;
    isAccepted: boolean;
}
export interface Query {
    params: Params;
    result: Result;
}
