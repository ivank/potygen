import { Parser, ParserError } from '@ikerin/rd-parse';
import { SqlGrammar } from '../../src/sql.grammar';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { convertTag } from '../../src/query-interface';

const sqlParser = Parser(SqlGrammar);

describe('Query Interface', () => {
  it.each(
    readdirSync(join(__dirname, 'sql')).map((filename) => [
      filename,
      readFileSync(join(__dirname, 'sql', filename), 'utf-8'),
    ]),
  )('Should convert complex sql %s', (name, sql) => {
    try {
      expect(convertTag(sqlParser(sql))).toMatchSnapshot(name);
    } catch (e) {
      if (e instanceof ParserError) {
        console.log(inspect(e, { depth: 15, colors: true }));
      }
      throw e;
    }
  });
});
