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
    const db = new Client({ database: 'potygen', user: 'potygen', password: 'dev-pass' });
    try {
      await db.connect();

      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const sqls = new SqlRead({
        path: '*.sql',
        root: join(__dirname, '../../../sql'),
        logger,
        watch: false,
      });
      const sink = new QueryLoader({
        db,
        root: __dirname,
        template: join(__dirname, '__generated__/{{name}}.queries.ts'),
        logger,
      });

      await asyncPipeline(sqls, sink);

      for (const file of Array.from(glob('__generated__/*.queries.ts', __dirname))) {
        expect(readFileSync(file, 'utf-8')).toMatchSnapshot(relative(__dirname, file));
      }
    } finally {
      await db.end();
    }
  });
});
