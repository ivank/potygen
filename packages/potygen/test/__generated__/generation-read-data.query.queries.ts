export interface Params {
    installationId?: number;
    exportDateOn?: Date;
}
export interface Result {
    dateOn: Date;
    value: number;
}
export interface Query {
    params: Params;
    result: Result;
}
