import { join } from 'path';
import { glob } from '../src';
import { sqlDir } from './helpers';

const cwd = (path: string) => join(__dirname, path);
const sql = (path: string) => join(sqlDir, path);

describe('Glob', () => {
  it.each<[string, string[]]>([
    [
      'dir/dir1/dir2',
      [
        cwd('dir/dir1/dir2/file5.txt'),
        cwd('dir/dir1/dir2/file6.txt'),
        cwd('dir/dir1/dir2/ts-file1.ts'),
        cwd('dir/dir1/dir2/ts-file2.ts'),
      ],
    ],
    ['dir/dir1/dir2/*.txt', [cwd('dir/dir1/dir2/file5.txt'), cwd('dir/dir1/dir2/file6.txt')]],
    ['dir/dir1/dir2/*.ts', [cwd('dir/dir1/dir2/ts-file1.ts'), cwd('dir/dir1/dir2/ts-file2.ts')]],
    ['dir/dir1/dir2/file[5,6].txt', [cwd('dir/dir1/dir2/file5.txt'), cwd('dir/dir1/dir2/file6.txt')]],
    ['dir/dir1/dir2/file?.txt', [cwd('dir/dir1/dir2/file5.txt'), cwd('dir/dir1/dir2/file6.txt')]],
    ['dir/dir1/dir2/fi???.txt', [cwd('dir/dir1/dir2/file5.txt'), cwd('dir/dir1/dir2/file6.txt')]],
    ['dir', [cwd('dir/file1.txt'), cwd('dir/file2.txt')]],
    [
      'dir/**/*.ts',
      [cwd('dir/dir1/dir2/ts-file1.ts'), cwd('dir/dir1/dir2/ts-file2.ts'), cwd('dir/dir1/dir3/ts-file3.ts')],
    ],
    ['dir/file1.txt', [cwd('dir/file1.txt')]],
    ['dir/file?.txt', [cwd('dir/file1.txt'), cwd('dir/file2.txt')]],
    ['dir/{file1,file2}.txt', [cwd('dir/file1.txt'), cwd('dir/file2.txt')]],
    [
      'dir/dir1/{dir2,dir3}/*.txt',
      [
        cwd('dir/dir1/dir2/file5.txt'),
        cwd('dir/dir1/dir2/file6.txt'),
        cwd('dir/dir1/dir3/file7.txt'),
        cwd('dir/dir1/dir3/file8.txt'),
      ],
    ],
    [
      'dir/dir1/{dir2,dir3}/*.{txt,ts}',
      [
        cwd('dir/dir1/dir2/file5.txt'),
        cwd('dir/dir1/dir2/file6.txt'),
        cwd('dir/dir1/dir2/ts-file1.ts'),
        cwd('dir/dir1/dir2/ts-file2.ts'),
        cwd('dir/dir1/dir3/file7.txt'),
        cwd('dir/dir1/dir3/file8.txt'),
        cwd('dir/dir1/dir3/ts-file3.ts'),
      ],
    ],
    ['dir/dir1/../dir1/dir2/../../*.txt', [cwd('dir/file1.txt'), cwd('dir/file2.txt')]],
    [
      'dir/dir1/{dir2,file3.txt}/*.txt',
      [cwd('dir/dir1/file3.txt'), cwd('dir/dir1/dir2/file5.txt'), cwd('dir/dir1/dir2/file6.txt')],
    ],
    [
      'dir/**/*',
      [
        cwd('dir/file1.txt'),
        cwd('dir/file2.txt'),
        cwd('dir/dir1/file3.txt'),
        cwd('dir/dir1/file4.txt'),
        cwd('dir/dir1/dir2/file5.txt'),
        cwd('dir/dir1/dir2/file6.txt'),
        cwd('dir/dir1/dir2/ts-file1.ts'),
        cwd('dir/dir1/dir2/ts-file2.ts'),
        cwd('dir/dir1/dir3/file7.txt'),
        cwd('dir/dir1/dir3/file8.txt'),
        cwd('dir/dir1/dir3/ts-file3.ts'),
      ],
    ],
    [
      '**/*.txt',
      [
        cwd('dir/file1.txt'),
        cwd('dir/file2.txt'),
        cwd('dir/dir1/file3.txt'),
        cwd('dir/dir1/file4.txt'),
        cwd('dir/dir1/dir2/file5.txt'),
        cwd('dir/dir1/dir2/file6.txt'),
        cwd('dir/dir1/dir3/file7.txt'),
        cwd('dir/dir1/dir3/file8.txt'),
      ],
    ],
  ])('Should glob generator %s', async (path, expected) => {
    expect(Array.from(glob(path, __dirname))).toEqual(expected);
  });

  it('Should parse route outside of current folder, when provided cwd', () => {
    expect(Array.from(glob('*.sql', sql('.')))).toEqual([
      sql('account-levelisation.update.query.sql'),
      sql('account-levelisation.upsert.query.sql'),
      sql('account-levelisations-bulk-close-accounts.query.sql'),
      sql('account-levelisations-set-bulk-update.query.sql'),
      sql('account-levelisations.query.sql'),
      sql('accounts.list.query.sql'),
      sql('accounts.query.sql'),
      sql('accounts.sql'),
      sql('bacs.query.sql'),
      sql('contracts.sql'),
      sql('delete-accounts.query.sql'),
      sql('generation-read-data.query.sql'),
      sql('installation-meter-update.query.sql'),
      sql('installations.sql'),
      sql('levelisations.list.query.sql'),
      sql('meter-reads.sql'),
      sql('process-batch.query.sql'),
      sql('rates-by-tarrif-ids.query.sql'),
      sql('read-create.query.sql'),
      sql('reads-by-account-id.query.sql'),
      sql('tariff-rates.sql'),
    ]);
  });
});
