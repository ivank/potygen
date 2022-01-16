import { Json } from "@potygen/potygen";
export interface Params<TParamItemsData = unknown> {
    items: {
        processId: number;
        idempotencyKey?: string;
        data: TParamItemsData;
        accountId: number;
    }[];
}
export interface Result<TData = unknown> {
    id: number;
    data: Json<TData>;
}
export interface Query<TParamItemsData = unknown, TData = unknown> {
    params: Params<TParamItemsData>;
    result: Result<TData>;
}
