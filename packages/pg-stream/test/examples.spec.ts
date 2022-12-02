import { execSync } from 'child_process';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { connectionString } from './helpers';

const examplesDir = join(__dirname, '../examples/');

const exampleFiles = readdirSync(examplesDir)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => [join('examples', file)]);

describe('Example files', () => {
  beforeAll(() => execSync('yarn tsc', { cwd: examplesDir }));
  afterAll(() =>
    readdirSync(examplesDir)
      .filter((file) => file.endsWith('.js'))
      .forEach((file) => unlinkSync(join(examplesDir, file))),
  );

  it.each(exampleFiles)('Should process %s', (file) => {
    const response = execSync(`yarn node ${file.replace('.ts', '.js')}`, {
      cwd: join(__dirname, '..'),
      env: { ...process.env, POSTGRES_CONNECTION: connectionString },
    });
    expect(response.toString()).toMatchSnapshot(file);
  });
});
