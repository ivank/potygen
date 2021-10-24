import { Client } from 'pg';
import { pipeline } from 'stream';
import { promisify } from 'util';
// import { SourceLoadError } from './LoadError';
import { SqlRead, QueryLoader } from './traverse';

const asyncPipeline = promisify(pipeline);

const main = async () => {
  const db = new Client({
    database: 'schemes',
    user: 'schemes',
    password: 'dev-pass',
    host: '127.0.0.1',
    port: 5432,
    ssl: false,
  });
  try {
    await db.connect();

    const sqls = new SqlRead('src/**/*.query.ts', '../../../schemes/packages/api');
    const sink = new QueryLoader(
      db,
      '../../../schemes/packages/api',
      '{{root}}/src/queries/__psql-ts__/{{name}}.queries.ts',
    );

    await asyncPipeline(sqls, sink);
    // } catch (error) {
    //   if (error instanceof SourceLoadError) {
    //     console.error(`Error in ${error.source.path}: ${error.message}`);
    //   }
  } finally {
    await db.end();
  }
};

main();
