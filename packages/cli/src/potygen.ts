import { Logger } from '@potygen/potygen';
import { existsSync, readFileSync } from 'fs';
import { inspect, promisify } from 'util';
import { Client } from 'pg';
import { pipeline } from 'stream';
import { Command, createCommand } from 'commander';
import { QueryLoader, SqlRead } from './traverse';
import { ConfigType, toConfig } from './config';

const asyncPipeline = promisify(pipeline);

enum LogLevel {
  error,
  info,
  debug,
}

class LogLevelConsole implements Logger {
  constructor(public level: LogLevel) {}

  error(...args: any[]): void {
    if (this.level >= LogLevel.error) {
      console.info(...args);
    }
  }

  info(...args: any[]): void {
    if (this.level >= LogLevel.info) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.level >= LogLevel.debug) {
      console.debug(...args);
    }
  }
}

export const potygen = (overwriteLogger?: Logger): Command =>
  createCommand('potygen')
    .description('Convert postgres query files inty typescript types')
    .version('0.5.11')
    .option('-c, --config <config>', 'A configuration file to load', 'potygen.config.json')
    .option('-f, --files <files>', 'A glob pattern to search files by (default: "**/*.sql")')
    .option('-w, --watch', 'Watch for file changes and update live')
    .option('-v, --verbose', 'Show verbose logs')
    .option('-s, --silent', 'Only show error logs')
    .option('-p, --typePrefix <typePrefix>', 'Prefix generated types')
    .option('-r, --root <root>', `Set the root directory (default: ${process.cwd()})`)
    .option(
      '-n, --connection <connection>',
      'Connection to the postgres database. URI (default: "postgres://localhost:5432/db")',
    )
    .option(
      '-t, --template <template>',
      'A template of the path, where to generate the typescript type files. The parameters are the response from node\'s path.parse function (default: "{{dir}}/{{name}}.queries.ts")',
    )
    .action(async (options: ConfigType & { config: string }) => {
      const { config, ...rest } = options;
      const { root, connection, watch, files, template, verbose, silent, typePrefix } = toConfig({
        ...(existsSync(config) ? JSON.parse(readFileSync(config, 'utf-8')) : {}),
        ...rest,
      });

      const logger =
        overwriteLogger ?? new LogLevelConsole(verbose ? LogLevel.debug : silent ? LogLevel.error : LogLevel.info);

      logger.debug(`Potygen Config: ${inspect({ root, connection, watch, files, template })}`);

      const db = new Client(connection);
      await db.connect();
      try {
        const sqls = new SqlRead({ path: files, root, watch, logger });
        const sink = new QueryLoader({ db, root, template, logger, typePrefix });

        logger.info(`Potygen started processing ("${files}", watch: ${watch})`);

        await asyncPipeline(sqls, sink);
      } catch (error) {
        if (process.env.POTYGEN_DEBUG && error instanceof Error) {
          logger.error(error.stack);
        } else {
          logger.error(String(error));
        }
      } finally {
        await db.end();
      }
    });
