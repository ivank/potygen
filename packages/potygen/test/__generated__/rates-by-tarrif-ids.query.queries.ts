export interface Params {
    ids: number[][];
}
export interface Result {
    tariffId: number;
    rate: number;
    startOn: Date;
    tariffCode: string;
    tariffType: "Export" | "Generation" | "SEG";
    endOn?: Date;
}
export interface Query {
    params: Params;
    result: Result;
}
