import { Json } from "@potygen/potygen";
export interface Params {
    q?: string;
    resolvedPostlev?: "" | boolean;
    state?: ("Pending" | "Done");
    levelisationId?: number;
    ids?: number[];
    sortField?: "totalPayment" | "vatPayment" | "generationPayment" | "exportPayment" | "generationEnergy" | "exportEnergy" | "cfrFitId" | "state" | "isAccepted" | "error" | "exportType";
    sortOrder?: "DESC" | "ASC";
    limit?: number;
    offset?: number;
}
export interface Result<TGenerationPeriods = unknown, TExportPeriods = unknown, TErrorParams = unknown> {
    id: number;
    levelisationId: number;
    accountId: number;
    installationId: number;
    state: "Pending" | "Done";
    isAccepted: boolean;
    generationStartReadOn?: Date;
    generationStartReadValue?: number;
    generationEndReadOn?: Date;
    generationEndReadValue?: number;
    generationPercentageSplit?: number;
    generationPayment?: number;
    generationEnergy?: number;
    exportStartReadOn?: Date;
    exportStartReadValue?: number;
    exportEndReadOn?: Date;
    exportEndReadValue?: number;
    exportPercentageSplit?: number;
    exportPayment?: number;
    exportEnergy?: number;
    exportType?: "Deemed" | "Metered Export" | "Off Grid" | "PPA";
    technologyType?: "PV" | "H" | "W" | "AD" | "CHP";
    totalPayment?: number;
    vatPayment?: number;
    generationPeriods?: Json<TGenerationPeriods>;
    exportPeriods?: Json<TExportPeriods>;
    errorCode?: string;
    errorParams?: Json<TErrorParams>;
    cfrFitId: string;
    resolvedPostlevId?: number;
    isBacsPaymentsSent?: boolean;
    isChequePaymentsSent?: boolean;
}
export interface Query<TGenerationPeriods = unknown, TExportPeriods = unknown, TErrorParams = unknown> {
    params: Params;
    result: Result<TGenerationPeriods, TExportPeriods, TErrorParams>;
}
