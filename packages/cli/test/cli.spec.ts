import { readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { potygen } from '../src/potygen';
import { connectionString, rootDir } from './helpers';

describe('CLI', () => {
  beforeEach(() =>
    readdirSync(join(__dirname, 'cli/__generated__'))
      .filter((name) => name.endsWith('.ts'))
      .forEach((name) => unlinkSync(join(__dirname, 'cli/__generated__', name))),
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
      'test/cli/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, 'cli/__generated__'));

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, 'cli/__generated__', name), 'utf-8')).toMatchSnapshot();
    }
  });

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
      '{{root}}/packages/cli/test/cli/__generated__/{{name}}.queries.ts',
      '--connection',
      connectionString,
    ]);

    expect(logger.error).not.toHaveBeenCalled();

    const resultQueries = readdirSync(join(__dirname, 'cli/__generated__'));

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, 'cli/__generated__', name), 'utf-8')).toMatchSnapshot();
    }
  });
});
