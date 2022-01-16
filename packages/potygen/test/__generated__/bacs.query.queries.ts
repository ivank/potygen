export interface Params {
    quarter?: string;
    perPage?: string;
    offset?: string;
}
export interface Result {
    fitId: string;
    name?: string;
    amount: number;
    quarter?: string;
    bankDetails: string;
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    postcode: string;
}
export interface Query {
    params: Params;
    result: Result;
}
