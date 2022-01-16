export interface Params {
    intervalStart?: Date;
    intervalEnd?: Date;
    accountId?: number;
    meterId?: number;
}
export interface Result {
    id: number;
    msn: string;
    mpan: string;
    make: string;
    model: string;
    type: "Export" | "Generation";
    currentPeriodRead?: {
        id: number;
        value: number;
        dateOn: Date;
        submittedAt?: Date;
        reason?: string;
        type: "Opening" | "Closing" | "Quarterly" | "Meter Verification";
    };
    previousPeriodRead?: {
        id: number;
        value: number;
        dateOn: Date;
        submittedAt?: Date;
        reason?: string;
        type: "Opening" | "Closing" | "Quarterly" | "Meter Verification";
    };
}
export interface Query {
    params: Params;
    result: Result;
}
