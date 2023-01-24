import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { glob } from '../src';
import { CacheStore } from '../src/cache';
import { SqlRead, QueryLoader } from '../src/traverse';
import { sqlDir, testDb } from './helpers';

const asyncPipeline = promisify(pipeline);

describe('Traverse', () => {
  it('Should work', async () => {
    const db = testDb();
    try {
      await db.connect();

      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
      const cacheStore = new CacheStore('');
      const sqls = new SqlRead({
        path: '*.sql',
        root: sqlDir,
        logger,
        watch: false,
        cacheStore,
      });
      const sink = new QueryLoader({
        db,
        root: __dirname,
        template: join(__dirname, '__generated__/{{name}}.queries.ts'),
        logger,
        cacheStore,
      });

      await asyncPipeline(sqls, sink);

      for (const file of Array.from(glob('__generated__/*.queries.ts', __dirname))) {
        expect(readFileSync(file, 'utf-8')).toMatchSnapshot(relative(__dirname, file));
      }
    } finally {
      await db.end();
    }
  }, 20000);
});
