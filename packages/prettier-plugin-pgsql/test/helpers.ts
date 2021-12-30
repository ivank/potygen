import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parser } from '@potygen/ast';

export const withParserErrors = (cb: () => void): void => {
  try {
    cb();
  } catch (e) {
    console.error(String(e));
    throw e;
  }
};

const files = join(__dirname, '../../../sql');

export const sqlFiles = (): [string, string][] =>
  readdirSync(files).map((filename) => [filename, readFileSync(join(files, filename), 'utf-8')]);

const stripPos = ({ start, end, ...rest }: any): any =>
  'values' in rest
    ? { ...rest, values: rest.values.map(stripPos) }
    : 'pick' in rest
    ? { ...rest, pick: rest.pick.map(stripPos) }
    : rest;

export const withoutPos = ({ ast, comments }: ReturnType<typeof parser>) => ({
  ast: stripPos(ast),
  comments: comments.map(stripPos),
});
