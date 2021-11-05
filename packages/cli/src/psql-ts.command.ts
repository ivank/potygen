import { Command, createCommand } from 'commander';
import { Logger } from './types';
import { QueryLoader, SqlRead } from './traverse';
import { Client } from 'pg';
import { promisify } from 'util';
import { pipeline } from 'stream';
const asyncPipeline = promisify(pipeline);

export const psqlTsCommand = (logger: Logger = console): Command =>
  createCommand('psql-ts')
    .description('Convert postgres query files inty typescript types')
    .argument('<glob>', 'The glob pattern to search by')
    .option('-w, --watch', 'Watch for file changes and update live')
    .option('-r, --root <root>', 'Set the root directory', process.cwd())
    .option('-c, --connection <connection>', 'Connection to the postgres database. URI', 'postgres://localhost:5432/db')
    .option(
      '-o, --output <output>',
      "A template of the path, where to generate the typescript type files. The parameters are the response from node's path.parse function",
      '{{dir}}/{{name}}.queries.ts',
    )
    .action(async (glob, { watch, root, output, connection }) => {
      const db = new Client(connection);
      await db.connect();
      try {
        const sqls = new SqlRead(glob, root, watch);
        const sink = new QueryLoader(db, root, output);

        await asyncPipeline(sqls, sink);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
      } finally {
        await db.end();
      }
    });
