import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { Client } from 'pg';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { glob } from '../src';
import { SqlRead, QueryLoader } from '../src/traverse';

const asyncPipeline = promisify(pipeline);

describe('Traverse', () => {
  it('Should work', async () => {
    const db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    try {
      await db.connect();

      const sqls = new SqlRead('*.sql', join(__dirname, '../../../sql'));
      const sink = new QueryLoader(db, __dirname, join(__dirname, '__generated__/{{name}}.queries.ts'));

      await asyncPipeline(sqls, sink);

      for (const file of Array.from(glob('__generated__/*.queries.ts', __dirname))) {
        expect(readFileSync(file, 'utf-8')).toMatchSnapshot(relative(__dirname, file));
      }
    } finally {
      await db.end();
    }
  });
});
