export interface Params {
    meterId?: number;
    reason?: string;
    type?: "Opening" | "Closing" | "Quarterly" | "Meter Verification";
    dateOn?: Date;
    submittedAt?: Date;
    value?: number;
}
export interface Result {
    id: number;
    value: number;
    meterId: number;
    submittedAt?: Date;
}
export interface Query {
    params: Params;
    result: Result;
}
