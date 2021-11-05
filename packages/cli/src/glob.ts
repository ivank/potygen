import { join, normalize, sep } from 'path';
import { Dirent, readdirSync } from 'fs';
import { Readable } from 'stream';

interface PartFilter {
  type: 'filter';
  value: RegExp;
  isRecursive?: boolean;
}
interface PartPath {
  type: 'path';
  value: string;
  isRecursive?: boolean;
}
type Part = PartFilter | PartPath;
interface Glob {
  type: 'glob';
  parts: Part[];
  cwd: string;
}
interface Directory {
  type: 'directory';
  value: string;
}
interface File {
  type: 'file';
  value: string;
}
type Path = Directory | File;
type LoadItem = Glob | File;

const toPath = (dirent: Dirent): Path =>
  dirent.isDirectory() ? { type: 'directory', value: dirent.name } : { type: 'file', value: dirent.name };

const loadDir = (name: string): Path[] => readdirSync(name, { withFileTypes: true }).map(toPath);
const isFile = (item: Path): item is File => item.type === 'file';
const isDirectory = (item: Path): item is File => item.type === 'directory';

const escapeRegExp = (str: string) => str.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
const isPartFilter = (str: string) => /[\?\*\[\]\}]/.test(str);

const toPatternFilter = (path: string) =>
  new RegExp(
    '^' +
      escapeRegExp(path)
        .replace(/\\\{([^\}]+)\\\}/g, (_, items) => `(${items.replace(',', '|')})`)
        .replace(/\\\?/g, '.')
        .replace(/\\\*/g, '.*')
        .replace(/\\\[([^\[]+)\\\]/g, '[$1]') +
      '$',
  );

const toParts = (path: string): Part[] =>
  normalize(path)
    .split(sep)
    .map<Part | undefined>((part, index, all) =>
      part === '**'
        ? undefined
        : isPartFilter(part)
        ? { type: 'filter', value: toPatternFilter(part), isRecursive: all[index - 1] === '**' }
        : { type: 'path', value: part, isRecursive: all[index - 1] === '**' },
    )
    .filter((item): item is Part => item !== undefined);

const loadNextGlob = (item: Glob): LoadItem[] => {
  const [filter, ...rest] = item.parts;
  const cwd = (path: string) => join(item.cwd, path);
  const paths = loadDir(item.cwd).sort((a, b) => (a.type === b.type ? 0 : a.type === 'file' ? -1 : 1));
  const { matches, other } = paths.reduce<{ matches: Path[]; other: Path[] }>(
    ({ matches, other }, path) =>
      (filter.type === 'filter' ? filter.value.test(path.value) : filter.value === path.value)
        ? { other, matches: matches.concat(path) }
        : { matches, other: other.concat(path) },
    { matches: [], other: [] },
  );
  const files = matches.filter(isFile);
  const dirs = matches.filter(isDirectory);

  const loadedMatches = [
    ...files.map<LoadItem>((file) => ({ ...file, value: cwd(file.value) })),
    ...(filter.isRecursive
      ? dirs.map<LoadItem>((path) => ({ type: 'glob', cwd: cwd(path.value), parts: item.parts }))
      : rest.length > 0
      ? dirs.map<LoadItem>((dir) => ({ type: 'glob', cwd: cwd(dir.value), parts: rest }))
      : filter.type === 'path'
      ? dirs.map<LoadItem>((dir) => ({ type: 'glob', cwd: cwd(dir.value), parts: [{ type: 'filter', value: /.*/ }] }))
      : []),
  ];

  return filter.isRecursive
    ? loadedMatches.concat(
        other.filter(isDirectory).map((path) => ({ type: 'glob', cwd: cwd(path.value), parts: item.parts })),
      )
    : loadedMatches;
};

export function* glob(path: string, cwd = '.') {
  let loadItems: LoadItem[] = [{ type: 'glob', parts: toParts(path), cwd }];

  do {
    const item = loadItems.shift();

    if (item) {
      if (item.type === 'file') {
        yield item.value;
      } else {
        loadItems = loadItems.concat(loadNextGlob(item));
      }
    }
  } while (loadItems.length > 0);
}
