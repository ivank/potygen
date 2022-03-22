import { createApp } from '../src/app';
import * as pgp from 'pg-promise';
import { createServer } from 'http';
import axios from 'axios';
import { sql } from '@potygen/potygen';

const connection = process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen';

describe('Integration test', () => {
  it('Test requests', async () => {
    const db = pgp()(connection);

    await sql`DELETE FROM books`(db, {});

    await sql`
      INSERT INTO "books" (
        id,
        isbn,
        title,
        author_id
      )
      VALUES
        (
          1,
          '0-333-45430-8',
          'Consider Phlebas',
          1
        ),
        (
          2,
          '0-333-47110-5',
          'The Player of Games',
          1
        ),
        (
          3,
          '0-312-85182-0',
          'A Fire Upon the Deep',
          2
        )
      `(db, {});

    const app = createApp(db);

    const server = createServer(app);
    await new Promise((resolve, reject) =>
      server.listen(3201, (error?: Error) => (error ? reject(error) : resolve(undefined))),
    );

    const { data } = await axios.get('http://localhost:3201/books/1');

    expect(data).toMatchSnapshot('Books');

    await axios.post('http://localhost:3201/books', { isbn: '11-22-33', title: 'Test', authorId: 1 });

    const { data: modifiedData } = await axios.get('http://localhost:3201/books/1');

    expect(modifiedData).toHaveLength(3);

    await db.$pool.end();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));
  });
});
