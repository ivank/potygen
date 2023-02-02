import { Logger, isNil } from '@potygen/potygen';
import { PromisePool } from '@supercharge/promise-pool';
import { existsSync, readFileSync, watchFile } from 'fs';
import { inspect } from 'util';
import { Client } from 'pg';
import { Command, createCommand } from 'commander';
import { toEmitter, CacheStore } from './emitter';
import { ConfigType, toConfig } from './config';
import { glob } from './glob';

enum LogLevel {
  error,
  info,
  debug,
}

class LogLevelConsole implements Logger {
  constructor(public level: LogLevel) {}

  error(...args: any[]): void {
    if (this.level >= LogLevel.error) {
      console.error(...args);
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
    .description('Convert postgres query files into typescript types')
    .version('0.9.1')
    .option('-c, --config <config>', 'A configuration file to load', 'potygen.config.json')
    .option('-f, --files <files>', 'A glob pattern to search files by (default: "**/*.sql")')
    .option('-w, --watch', 'Watch for file changes and update live')
    .option('-v, --verbose', 'Show verbose logs')
    .option('-a, --cache-file <cacheFile>', 'Cache file to be used by --cache', '.cache/potygen.cache')
    .option('-r, --cache-clear', 'Clear the cache')
    .option('-e, --cache', 'Cache which files have been processed, defaults .cache/potygen.cache')
    .option('-s, --silent', 'Only show error logs')
    .option('-p, --type-prefix <typePrefix>', 'Prefix generated types')
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
      const { root, connection, watch, files, template, verbose, silent, typePrefix, cache, cacheFile, cacheClear } =
        toConfig({
          ...(existsSync(config) ? JSON.parse(readFileSync(config, 'utf-8')) : {}),
          ...rest,
        });

      const logger =
        overwriteLogger ?? new LogLevelConsole(verbose ? LogLevel.debug : silent ? LogLevel.error : LogLevel.info);

      logger.debug(`Potygen Config: ${inspect({ root, connection, watch, files, template })}`);

      const db = new Client(connection);
      await db.connect();
      try {
        const cacheStore = new CacheStore(cacheFile, cache, cacheClear);
        await cacheStore.load();
        const emit = await toEmitter({ db, logger }, cacheStore, { root, template, typePrefix });
        const { results, errors } = await PromisePool.withConcurrency(20)
          .for(Array.from(glob(files, root)))
          .process(emit);

        if (errors.length) {
          logger.error('Errors:');
          logger.error('------------------------------');
          for (const error of errors) {
            logger.error(`[${error.item}]`);
            logger.error(process.env.POTYGEN_DEBUG ? error.stack : String(error.raw));
            logger.error('\n');
          }
        }
        if (watch) {
          for (const { path } of results.filter(isNil)) {
            watchFile(path, () => emit(path));
          }
        }
        await cacheStore.save();
      } finally {
        if (!watch) {
          await db.end();
        }
      }
    });
