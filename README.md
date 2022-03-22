# Potygen (Postgres typescript generator)

- 🛡️ Type Safe SQL inputs and outputs at compile time
- 📜 Tables, columns and types autocompletion
- 🔎 Inline table and column information on hover
- 🪶 Pure JS and no dependencies
- 💅 Prittier plugin

## Prettier & Typescript showcase

![Video showcasing potygen autocomplete, type generation, prettier and typescript integration](./docs/potygen.mov)

List of features

- [x] Load views types
- [x] Prettier plugin for formatting sql queries
- [x] Typescript language server extension to add autocomplete and quickinfo to the typescript LSP. Any editor implementing LSP is supported.
- [x] json_build_object parsing - will return the built json type as a object literal type, preserving its full shape
- [x] enums loading - will show enums in quick info, autocompletion as well as type generation
- [x] custom types loading - composite types are parsed and returned in typescript
- [x] custom functions - alongside all the built in postgres functions, typescript types will be generated for arguments and returns of custom functions too
- [x] load comments from tables, columns, views, types and functions. Show in both quickinfo and typescript types
- [x] for jsonb columns, generate generic types, which you can plug with your own types where appropriate
- [x] supports CTEs, subqueries, nested joins and recordsets
- [ ] alter table syntax
- [ ] truncate table syntax

## Why ?

Looking to interact with your database, well you have several choices by the looks of it:

### Plain SQL

```ts
const { rows } = await db.query(
  `
  UPDATE projects SET
    last_opened = NOW(),
    open_count = open_count + 1
  WHERE
    projects.id IN (
      SELECT project_id 
      FROM project_members WHERE user_id = $1
    )
  RETURNING *
`,
  [userId],
);
```

| Pros                                           | Cons                                            |
| ---------------------------------------------- | ----------------------------------------------- |
| Efficient queries                              | Very easy to make mistakes                      |
| Explicit - No magic, full control              | No way of telling if correct unless code is run |
| Functional stateless data flow, atomic updates | Can be quite verbose                            |
|                                                | Requires knowledge about SQL & your database    |
|                                                | No type safety                                  |

### ORMs (Sequelize, TypeORM, ...)

```ts
const user = await User.findById(userId);
const projects = await user.getProjects();

const updatedProjects = await Promise.all(
  projects.map(async (project) => {
    project.last_opened = new Date(Date.now());
    project.open_count++;
    return project.save();
  }),
);
```

| Pros                                  | Cons                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Easy to get started                   | Implicit - Actual database queries barely visible                      |
| Type-safety                           | Usually leads to inefficient queries                                   |
| Less error-prone than writing raw SQL | Update operations based on potentially stale local data                |
| Requires no SQL knowledge             | Requires knowledge about SQL & your database                           |
|                                       | Virtually limits you to a primitive subset of your database's features |

### Query builder (Knex.js, Prisma, ...)

```ts
const usersProjects = await prisma.user({ id: userId }).projects();

const updatedProjects = await Promise.all(
  projects.map((project) =>
    prisma.updateProject({
      data: {
        last_opened: new Date(Date.now()),
        open_count: project.open_count + 1,
      },
      where: {
        id: project.id,
      },
    }),
  ),
);
```

| Pros                                 | Cons                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| Explicit - Full control over queries | Additional abstraction layer with its own API                                 |
| Functional stateless data flow       | Atomic updates still hardly possible                                          |
| Type-safety                          | Requires knowledge about both, SQL & your database plus the query builder API |
|                                      | No access to more powerful database features                                  |

### Sql with potygen 🚀

```ts
const updateQuery = sql<UpdateQuery>`
  UPDATE projects
  SET
    last_opened = NOW(),
    open_count = open_count + 1
  WHERE
    projects.id IN (SELECT project_id FROM project_members WHERE user_id = $userId)
  RETURNING
    *
  `;
await updateQuery(db, { userId });
```

| Pros                                           | Cons            |
| ---------------------------------------------- | --------------- |
| Query Validation at compile time               | Knowlege of SQL |
| Explicit - Full control, no implicit magic     |                 |
| Functional stateless data flow, atomic updates |                 |
| Type Safety                                    |                 |

As the comment [comment from Hacker News regarding "The Art of PostgreSQL" states](https://news.ycombinator.com/item?id=27842351):

> It took my SQL from “the database is not much more than a place to persist application data” to “the application is not much more than a way to match commands to the database”.

## Installation

For basic functionality you'll need a runtime dependency of '@potygen/potygen'

```shell
yarn add @potygen/potygen
```

And to get type generation, you'll need to install the cli tool:

```shell
yarn add --dev @potygen/cli
```

For prettier and typescript support refer to [@package/prettier-plugin-pgsql](./packages/prettier-plugin-pgsql) and [@package/typescript-pgsql-plugin](./packages/typescript-pgsql-plugin)

## Example express app

An example very simple - [examples/bookstore](./examples/bookstore/) shows the type generation in action. Though the incoming types from express are usually just "any". For better safety you'll need to use a framework that gives you statically verifiable data.

> [examples/bookstore/src/app.ts](https://github.com/ivank/potygen/tree/main/examples/bookstore/src/app.ts)

```ts
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
```

## State

Project state: Beta. It is used in production, but might not be able to parse some complex queries. In the [sql](./sql) folder you'll find the kinds of queries potygen was designed to deal with, and can decide whether it can handle the complexity that you need.

This project is being actively developed and its APIs might change. All issue reports, feature requests and PRs appreciated.
