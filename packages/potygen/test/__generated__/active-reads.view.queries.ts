import { Json } from "@potygen/potygen";
export interface Params {
}
export interface Result<THistory = unknown> {
    id: number;
    meter_id: number;
    date_on: Date;
    value: number;
    type: "Opening" | "Closing" | "Quarterly" | "Meter Verification";
    reason?: string;
    created_at: Date;
    updated_at?: Date;
    /**
     * sql-fit: MeterReading.MeterReadingId
     */
    source_system_id?: number;
    checked: boolean;
    deleted_at?: Date;
    submitted_at?: Date;
    history: Json<THistory>;
    overwritten_at?: Date;
}
export interface Query<THistory = unknown> {
    params: Params;
    result: Result<THistory>;
}
