# Potygen (Postgres typescript generator)

- 🛡️ Type Safe SQL inputs and outputs at compile time
- 📜 Tables, columns and types autocompletion
- 🔎 Inline table and column information on hover
- 🪶 Pure JS and no dependencies
- 💅 Prittier plugin

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
  UPDATE projects SET
    last_opened = NOW(),
    open_count = open_count + 1
  WHERE
    projects.id IN (
      SELECT project_id FROM project_members WHERE user_id = $userId
    )
  RETURNING *
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

Using

## Docs

Project state:

This project is being actively developed and its APIs might change. All issue reports, feature requests and PRs appreciated.

Remaining Work:

- [ ] dogfooding our queries, plus use the generated types instead of the hand crafted ones
- [ ] Hardcode native functions + operators
