import { Client } from 'pg';
import { pipeline } from 'stream';
import { promisify } from 'util';

const asyncPipeline = promisify(pipeline);

import { SqlRead, QueryLoader } from '../src/traverse';

// const cwd = (path: string) => join(__dirname, path);

describe('Traverse', () => {
  it('Should work', async () => {
    const db = new Client({ database: 'sql-ast', user: 'sql-ast', password: 'dev-pass' });
    try {
      await db.connect();

      const sqls = new SqlRead('dir/**/*.ts', __dirname);
      const sink = new QueryLoader(db, __dirname, '{{root}}/__generated__/{{name}}.queries.ts');

      await asyncPipeline(sqls, sink);
    } finally {
      await db.end();
    }
  });
});
