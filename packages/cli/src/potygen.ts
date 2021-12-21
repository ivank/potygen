import { Command, createCommand } from 'commander';
import { Logger } from './types';
import { QueryLoader, SqlRead } from './traverse';
import { Client } from 'pg';
import { inspect, promisify } from 'util';
import { pipeline } from 'stream';
import { existsSync, readFileSync } from 'fs';
import { Record, String, Optional, Boolean, Static } from 'runtypes';

const Config = Record({
  files: Optional(String),
  watch: Optional(Boolean),
  root: Optional(String),
  connection: Optional(String),
  template: Optional(String),
  verbose: Optional(Boolean),
  silent: Optional(Boolean),
});

type ConfigType = Static<typeof Config>;

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
    .version('0.2.0')
    .option('-c, --config <config>', 'A configuration file to load', 'potygen.config.json')
    .option('-f, --files <files>', 'A glob pattern to search files by (default: "**/*.sql")')
    .option('-w, --watch', 'Watch for file changes and update live')
    .option('-v, --verbose', 'Show verbose logs')
    .option('-s, --silent', 'Only show error logs')
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
      const config: ConfigType = existsSync(options.config)
        ? Config.check(JSON.parse(readFileSync(options.config, 'utf-8')))
        : {};

      const { root, connection, watch, files, template, verbose, silent } = {
        files: '**/*.sql',
        root: process.cwd(),
        template: '{{dir}}/{{name}}.queries.ts',
        connection: 'postgres://localhost:5432/db',
        watch: false,
        ...config,
        ...options,
      };

      const logger =
        overwriteLogger ?? new LogLevelConsole(verbose ? LogLevel.debug : silent ? LogLevel.error : LogLevel.info);

      logger.debug(`Potygen Config: ${inspect({ root, connection, watch, files, template })}`);

      const db = new Client(connection);
      await db.connect();
      try {
        const sqls = new SqlRead({ path: files, root, watch, logger });
        const sink = new QueryLoader({ db, root, template, logger });

        logger.info(`Potygen started processing ("${files}", watch: ${watch})`);

        await asyncPipeline(sqls, sink);
      } catch (error) {
        if (process.env.POTYGEN_DEBUG && error instanceof Error) {
          logger.error(error.stack);
        } else {
          logger.error(global.String(error));
        }
      } finally {
        await db.end();
      }
    });
