export interface Params {
    fitIds?: string[];
}
export interface Result {
    cfrFiTId?: string;
    email?: string;
    contactName: string;
    company?: string;
    line1?: string;
    line2: string;
    town?: string;
    postcode: string;
    county?: string;
    country: string;
}
export interface Query {
    params: Params;
    result: Result;
}
