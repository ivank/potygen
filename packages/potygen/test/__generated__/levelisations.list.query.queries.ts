export interface Params {
    q?: string;
    ids?: number[];
    sortField?: "quarter";
    sortOrder?: "DESC" | "ASC";
    limit?: number;
    offset?: number;
}
export interface Result {
    id: number;
    quarter: string;
    startOn: Date;
    endOn: Date;
}
export interface Query {
    params: Params;
    result: Result;
}
