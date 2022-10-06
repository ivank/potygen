import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { LoadError } from '../src';

export const withParserErrors = async (cb: () => void | Promise<void>) => {
  try {
    await cb();
  } catch (e) {
    console.log('!!!');
    console.error(String(e), e instanceof LoadError ? e.tag : e);
    throw e;
  }
};
export const rootDir = join(__dirname, '../../../');
const files = join(__dirname, '../../../sql');
export const sqlDir = join(rootDir, 'sql');

export const sqlFiles = (): [string, string][] =>
  readdirSync(files).map((filename) => [filename, readFileSync(join(files, filename), 'utf-8')]);

export const connectionString = process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen';

export const testDb = () => new Client({ connectionString });
