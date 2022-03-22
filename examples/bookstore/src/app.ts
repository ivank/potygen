import * as express from 'express';
import * as bodyParser from 'body-parser';
import { sql, SqlDatabase } from '@potygen/potygen';
import { BooksSqlQuery, InsertBookSqlQuery } from './app.queries';

export const createApp = (db: SqlDatabase) => {
  const app = express();

  app.use(bodyParser.json());

  const booksSql = sql<BooksSqlQuery>`
    SELECT
      books.id,
      books.title,
      books.isbn,
      authors.name AS "authorName",
      COUNT(book_orders.amount) AS "copiesSold"
    FROM
      books
      JOIN authors
        ON authors.id = books.author_id
      LEFT JOIN book_orders
        ON book_orders.book_id = books.id AND book_orders.state = 'Paid'
    WHERE
      authors.id = $authorId!
    GROUP BY
      books.id,
      authors.name
    ORDER BY
      books.id ASC
    `;

  const insertBookSql = sql<InsertBookSqlQuery>`
    INSERT INTO books (
      isbn,
      title,
      author_id
    )
    VALUES
      (
        $isbn!,
        $title,
        $authorId
      )
    RETURNING
      id,
      isbn,
      title,
      author_id AS "authorId"
    `;

  app.get('/books/:authorId', async (req, res) => {
    const books = await booksSql(db, { authorId: Number(req.params.authorId) });
    res.json(books);
  });

  app.post('/books', async (req, res) => {
    const [book] = await insertBookSql(db, req.body);
    res.json(book);
  });

  return app;
};
