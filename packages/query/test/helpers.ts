import { ParserError } from '@ikerin/rd-parse';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const withParserErrors = (cb: () => void): void => {
  try {
    cb();
  } catch (e) {
    if (e instanceof ParserError) {
      console.log(inspect(e, { depth: 15, colors: true }));
    }
    throw e;
  }
};

const files = join(__dirname, '../../../sql');

export const sqlFiles = (): [string, string][] =>
  readdirSync(files).map((filename) => [filename, readFileSync(join(files, filename), 'utf-8')]);
