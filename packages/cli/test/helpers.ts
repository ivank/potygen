import { ParserError } from '@ikerin/rd-parse';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

type CB = () => void;
type AsyncCB = () => Promise<void>;
export const withParserErrors = async (cb: CB | AsyncCB): Promise<void> => {
  try {
    await cb();
  } catch (e) {
    if (e instanceof ParserError) {
      console.log(inspect(e, { depth: 15, colors: true }));
    }
    throw e;
  }
};

export const rootDir = join(__dirname, '../../../');
export const sqlDir = join(rootDir, 'sql');

export const sqlFiles = (): [string, string][] =>
  readdirSync(sqlDir).map((filename) => [filename, readFileSync(join(sqlDir, filename), 'utf-8')]);

export const connectionString = process.env.POSTGRES_CONNECTION ?? 'postgres://potygen:dev-pass@localhost:5432/potygen';

export const testDb = () => new Client({ connectionString });
