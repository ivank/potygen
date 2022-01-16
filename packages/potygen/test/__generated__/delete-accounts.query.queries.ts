export interface Params {
    type?: "FIT" | "SEG";
    state?: "Active" | "Pending" | "Dispute" | "Closed";
}
export interface Result {
    id: number;
    sourceSystemId?: number;
    customerId: number;
}
export interface Query {
    params: Params;
    result: Result;
}
