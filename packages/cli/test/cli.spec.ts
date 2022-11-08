import { readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { potygen } from '../src/potygen';
import { connectionString, rootDir } from './helpers';
import * as packageJson from '../package.json';

describe('CLI', () => {
  beforeEach(() =>
    readdirSync(join(__dirname, '__generated__'))
      .filter((name) => name.endsWith('.ts'))
      .forEach((name) => unlinkSync(join(__dirname, '__generated__', name))),
  );

  it('Should use cli to run pipeline on ts files', async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '--root',
      join(__dirname, '../'),
      '--files',
      'test/dir/**/*.ts',
      '--template',
      'test/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, '__generated__'))
      .filter((item) => item.endsWith('.ts'))
      .sort();

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, '__generated__', name), 'utf-8')).toMatchSnapshot(name);
    }
  }, 20000);

  it('Should use type prefix when generating files', async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '--root',
      join(__dirname, '../'),
      '--files',
      'test/dir/**/*.ts',
      '--template',
      'test/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
      '--typePrefix',
      'TMP2',
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, '__generated__'))
      .filter((item) => item.endsWith('.ts'))
      .sort();

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, '__generated__', name), 'utf-8')).toMatchSnapshot(name);
    }
  }, 20000);

  it('Should use cli to run pipeline on sql files', async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '--root',
      rootDir,
      '--files',
      'sql/*.sql',
      '--template',
      '{{root}}/packages/cli/test/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, '__generated__'))
      .filter((item) => item.endsWith('.ts'))
      .sort();

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, '__generated__', name), 'utf-8')).toMatchSnapshot(name);
    }
  }, 20000);

  it('Should use cli to run pipeline on sql files with preloading', async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '--root',
      rootDir,
      '--files',
      'sql/*.sql',
      '--template',
      '{{root}}/packages/cli/test/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
      '--preload',
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, '__generated__'))
      .filter((item) => item.endsWith('.ts'))
      .sort();

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, '__generated__', name), 'utf-8')).toMatchSnapshot(name);
    }
  }, 20000);

  it('Should have the correct version', async () => {
    const logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

    await expect(potygen(logger).exitOverride().parseAsync(['node', 'potygen', '--version'])).rejects.toMatchObject({
      name: 'CommanderError',
      message: packageJson.version,
    });
  });
});
