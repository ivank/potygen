export interface ICreateQueryParams<TParamChanges = unknown> {
    accountId: number;
    resource: "account" | "account-contract" | "meter" | "read" | "contact" | "account-contract-installation-meter";
    resourceId: number;
    changes: TParamChanges;
    userId: number;
    currentDate: Date;
}
export interface ICreateQueryResult {
}
export interface ICreateQueryQuery<TParamChanges = unknown> {
    params: ICreateQueryParams<TParamChanges>;
    result: ICreateQueryResult[];
}
