import { Parser, ParserError } from '@ikerin/rd-parse';
import { SqlGrammar } from '../../src/sql.grammar';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const sqlParser = Parser(SqlGrammar);

describe('Sql Files', () => {
  it.each(
    readdirSync(join(__dirname, 'sql')).map((filename) => [
      filename,
      readFileSync(join(__dirname, 'sql', filename), 'utf-8'),
    ]),
  )('Should parse complex sql %s', (name, sql) => {
    try {
      expect(sqlParser(sql)).toMatchSnapshot(name);
    } catch (e) {
      if (e instanceof ParserError) {
        console.log(inspect(e, { depth: 15, colors: true }));
      }
      throw e;
    }
  });
});
