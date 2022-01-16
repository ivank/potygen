export interface Params {
    id?: number;
    offset?: string;
    perPage?: string;
}
export interface Result {
    id: number;
    msn: string;
    meterId: number;
    dateOn: Date;
    value: number;
    type: "Opening" | "Closing" | "Quarterly" | "Meter Verification";
    reason?: string;
    createdAt: Date;
    updatedAt?: Date;
    /**
     * sql-fit: MeterReading.MeterReadingId
     */
    sourceSystemId?: number;
    mpan: string;
}
export interface Query {
    params: Params;
    result: Result;
}
