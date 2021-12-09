import { readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { potygen } from '../src/potygen';

describe('CLI', () => {
  beforeEach(() =>
    readdirSync(join(__dirname, 'cli/__generated__')).forEach((name) =>
      unlinkSync(join(__dirname, 'cli/__generated__', name)),
    ),
  );

  it('Should use cli to run pipeline on ts files', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '-r',
      join(__dirname, '../'),
      '-f',
      'test/dir/**/*.ts',
      '-t',
      'test/cli/__generated__/{{name}}.queries.ts',
      '-n',
      'postgres://sql-ast:dev-pass@localhost:5432/sql-ast',
    ]);

    const resultQueries = readdirSync(join(__dirname, 'cli/__generated__'));

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, 'cli/__generated__', name), 'utf-8')).toMatchSnapshot();
    }
  });

  it('Should use cli to run pipeline on sql files', async () => {
    const logger = { info: jest.fn(), error: jest.fn() };

    await potygen(logger).parseAsync([
      'node',
      'potygen',
      '--root',
      join(__dirname, '../../../'),
      '-f',
      'sql/*.sql',
      '-t',
      '{{root}}/packages/cli/test/cli/__generated__/{{name}}.queries.ts',
      '-n',
      'postgres://sql-ast:dev-pass@localhost:5432/sql-ast',
    ]);

    const resultQueries = readdirSync(join(__dirname, 'cli/__generated__'));

    expect(resultQueries).toMatchSnapshot();

    for (const name of resultQueries) {
      expect(readFileSync(join(__dirname, 'cli/__generated__', name), 'utf-8')).toMatchSnapshot();
    }
  });
});
