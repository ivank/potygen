# Potygen CLI (Postgres typescript generator)

Command line tool for generating types for [potygen](https://github.com/ivank/potygen)

## Installation

```shell
yarn add --dev @potygen/cli
```

## Usage

If we had sql string templates like this:

> [examples/simple.ts](https://github.com/ivank/potygen/tree/main/packages/cli/examples/simple.ts)

```ts
import { sql } from '@potygen/potygen';
import { Client } from 'pg';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();
  const productsSql = sql`SELECT product FROM orders WHERE region = $region`;
  const data = await productsSql(db, { region: 'Sofia' });

  console.log(data);

  await db.end();
}

main();
```

We could then run the potygen cli tool to generate types for them

```
yarn potygen -n postgres://localhost:5432/postgres examples/simple.ts
```

After that you can import the types and use them, which will type both parameters of the query as well as the results

> [examples/simple-typed.ts](https://github.com/ivank/potygen/tree/main/packages/cli/examples/simple-typed.ts)

```ts
import { sql } from '@potygen/potygen';
import { Client } from 'pg';
import { ProductsSqlQuery } from './simple-typed.queries';

const db = new Client(process.env.POSTGRES_CONNECTION);

async function main() {
  await db.connect();
  const productsSql = sql<ProductsSqlQuery>`SELECT product FROM orders WHERE region = $region`;
  const data = await productsSql(db, { region: 'Sofia' });

  console.log(data);

  await db.end();
}

main();
```

## Config

You can define potygen.config.json or provide a json file to the --config property. The full list of parameters are:

```
Usage: potygen [options]

Convert postgres query files into typescript types

Options:
  -V, --version                  output the version number
  -c, --config <config>          A configuration file to load (default: "potygen.config.json")
  -f, --files <files>            A glob pattern to search files by (default: "**/*.sql")
  -w, --watch                    Watch for file changes and update live
  -v, --verbose                  Show verbose logs
  -a, --cache-file <cacheFile>   Cache file to be used by --incremental (default: ".cache/potygen.cache")
  -r, --cache-clear              Clear the cache
  -e, --cache                    Cache which files have been processed, defaults .cache/potygen.cache
  -s, --silent                   Only show error logs
  -p, --typePrefix <typePrefix>  Prefix generated types
  -l, --preload                  Load all data at once. Slower start but faster for a lot of files
  -r, --root <root>              Set the root directory (default: ~/Projects/potygen/packages/cli)
  -n, --connection <connection>  Connection to the postgres database. URI (default: "postgres://localhost:5432/db")
  -t, --template <template>      A template of the path, where to generate the typescript type files. The parameters are the response from node's path.parse function (default:
                                 "{{dir}}/{{name}}.queries.ts")
  -h, --help                     display help for command
```
