export interface BooksQueryParams {
    authorId?: number;
}
export interface BooksQueryResult {
    id: number;
    isbn: string;
    authorName: string;
    copiesSold: number;
}
export interface BooksQueryQuery {
    params: BooksQueryParams;
    result: BooksQueryResult;
}
