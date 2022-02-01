import { sql } from '@potygen/potygen';
import { BooksQueryQuery } from './index.queries';
import * as express from 'express';
import * as pgp from 'pg-promise';
const app = express();
const port = 3000;

const db = pgp()(process.env.PG_CONNECTION!);

const booksQuery = sql<BooksQueryQuery>`
  SELECT
    books.id,
    books.isbn,
    authors.name AS "authorName",
    COUNT(orders.amount) AS "copiesSold"
  FROM
    books
    JOIN authors
      ON authors.id = books.author_id
    LEFT JOIN orders
      ON orders.book_id = books.id AND orders.state = 'Paid'
  WHERE
    authors.id = $authorId
  GROUP BY
    books.id
  `;

app.get('/books', async (req, res) => {
  await booksQuery(db, {});

  res.send('Hello World!');
});

app.post('/books', async (req, res) => {
  await booksQuery(db, {});

  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
