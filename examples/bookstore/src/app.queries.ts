export interface BooksSqlParams {
  authorId: number;
}
export interface BooksSqlResult {
  id: number;
  isbn: string;
  authorName: string;
  copiesSold: number;
}
export interface BooksSqlQuery {
  params: BooksSqlParams;
  result: BooksSqlResult[];
}
export interface InsertBookSqlParams {
  isbn: string;
  title?: string;
  authorId?: number;
}
export interface InsertBookSqlResult {
  id: number;
  isbn: string;
  title?: string;
  authorId?: number;
}
export interface InsertBookSqlQuery {
  params: InsertBookSqlParams;
  result: InsertBookSqlResult[];
}
