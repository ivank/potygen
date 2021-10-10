import { join } from 'path';
import { glob } from '../src/glob';

const cwd = (path: string) => join(__dirname, path);

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
});
