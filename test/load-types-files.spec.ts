import { Parser, ParserError } from '@ikerin/rd-parse';
import { SqlGrammar } from '../src/sql.grammar';
import { inspect } from 'util';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { convertSelect } from '../src/query-interface';
import { Client } from 'pg';
import { loadTypes } from '../src/load-types';

const parser = Parser(SqlGrammar);
let db: Client;

describe('Load Files', () => {
  beforeAll(async () => {
    db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    await db.connect();
  });

  afterAll(async () => {
    await db.end();
  });

  it.each(
    readdirSync(join(__dirname, 'sql')).map((filename) => [
      filename,
      readFileSync(join(__dirname, 'sql', filename), 'utf-8'),
    ]),
  )('Should convert complex sql %s', async (name, sql) => {
    try {
      const ast = parser(sql);
      const queryInterface = convertSelect(ast);
      const loadedQueryInterface = await loadTypes(db, queryInterface);
      expect(loadedQueryInterface).toMatchSnapshot(name);
    } catch (e) {
      if (e instanceof ParserError) {
        console.log(inspect(e, { depth: 15, colors: true }));
      }
      throw e;
    }
  });
});
