import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

export const withParserErrors = async (cb: () => void | Promise<void>) => {
  try {
    await cb();
  } catch (e) {
    console.error(String(e));
    throw e;
  }
};

const files = join(__dirname, '../../../sql');

export const sqlFiles = (): [string, string][] =>
  readdirSync(files).map((filename) => [filename, readFileSync(join(files, filename), 'utf-8')]);

export const connectionString = process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen';

export const testDb = () => new Client({ connectionString });
