import { readFileSync } from 'fs';
import { join, relative } from 'path';
import { glob } from '../src';
import { CacheStore, toEmitter } from '../src/emitter';

import { sqlDir, testDb } from './helpers';

describe('Traverse', () => {
  it('Should work', async () => {
    const db = testDb();
    try {
      await db.connect();
      const cacheStore = new CacheStore('');
      const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

      await Promise.all(
        Array.from(glob('*.sql', sqlDir)).map(
          await toEmitter({ db, logger }, cacheStore, {
            root: sqlDir,
            template: join(__dirname, '__generated__/{{name}}.queries.ts'),
          }),
        ),
      );

      for (const file of Array.from(glob('__generated__/*.queries.ts', __dirname))) {
        expect(readFileSync(file, 'utf-8')).toMatchSnapshot(relative(__dirname, file));
      }
    } finally {
      await db.end();
    }
  }, 20000);
});
