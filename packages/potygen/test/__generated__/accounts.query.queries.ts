export interface Params {
    q?: string;
    ids?: number[];
    limit?: number;
    offset?: number;
}
export interface Result {
    id: number;
    state: "Active" | "Pending" | "Dispute" | "Closed";
    startOn?: Date;
    firstName: string;
    lastName: string;
    email?: string;
    address: string;
    fitIds: string[];
}
export interface Query {
    params: Params;
    result: Result;
}
