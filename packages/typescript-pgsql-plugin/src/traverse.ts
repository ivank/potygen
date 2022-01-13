import {
  Tag,
  isNode,
  isFunction,
  isColumn,
  isQualifiedIdentifier,
  SqlTag,
  parser,
  isIdentifier,
  last,
  ColumnTag,
} from '@potygen/ast';
import { LoadedData, LoadedSource, toLoadedContext } from '@potygen/cli';
import { isTypeNullable, toQueryInterface } from '@potygen/query';
import * as tss from 'typescript/lib/tsserverlibrary';

export interface PathItem<T extends Tag> {
  index?: number;
  tag: T;
}
export type Path = PathItem<Tag>[];

const isItem =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (item: PathItem<Tag>): item is PathItem<T> =>
    predicate(item.tag);

const closestParent =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): T | undefined =>
    path.find(isItem(predicate))?.tag;

const closestParentPath =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): PathItem<T> | undefined =>
    path.find(isItem(predicate));

export const toPath = (tag: Tag, offset: number, path: Path = []): Path => {
  if (isNode(tag)) {
    const index = (tag.values as Tag[]).findIndex((item) => offset >= item.start && offset <= item.end);

    if (index !== -1) {
      return toPath(tag.values[index], offset, [{ tag, index }, ...path]);
    }
  }
  return [{ tag }, ...path];
};

const closestParentFunction = closestParent(isFunction);
const closestParentQualifiedIdentifier = closestParent(isQualifiedIdentifier);
const closestParentColumnPath = closestParentPath(isColumn);
const closestIdentifier = closestParent(isIdentifier);

export const getFunctionName = (path: Path) => {
  const parentFunction = closestParentFunction(path);

  if (parentFunction) {
    const name = closestParentQualifiedIdentifier(path);
    if (parentFunction.values[0] === name) {
      return name;
    }
  }
  return undefined;
};

interface SourceColumnInfo {
  type: 'SourceColumn';
  name: string;
  start: number;
  end: number;
  source?: string;
  schema?: string;
}

interface SourceInfo {
  type: 'Source';
  name: string;
  start: number;
  end: number;
  schema?: string;
}

interface SchemaInfo {
  type: 'Schema';
  name: string;
  start: number;
  end: number;
}

type Info = SourceColumnInfo | SourceInfo | SchemaInfo;

const toColumnInfo = ({ values, start, end }: ColumnTag): SourceColumnInfo => ({
  type: 'SourceColumn',
  schema: values.length === 3 ? values[0].value : undefined,
  source: values.length === 3 ? values[1].value : values.length === 2 ? values[0].value : undefined,
  name: last(values).value,
  start,
  end,
});

const toInfo = (path: Path): Info | undefined => {
  const identifier = closestIdentifier(path);
  const parentColumnPath = closestParentColumnPath(path);

  if (identifier && parentColumnPath) {
    const columnInfo = toColumnInfo(parentColumnPath.tag);
    const pos = { start: identifier.start, end: identifier.end };

    switch (parentColumnPath.index) {
      case 2:
        return columnInfo;
      case 1:
        return columnInfo.schema && columnInfo.source
          ? { type: 'Source', name: columnInfo.source, schema: columnInfo.schema, ...pos }
          : columnInfo;
      case 0:
        return columnInfo.schema
          ? { type: 'Schema', name: columnInfo.schema, ...pos }
          : columnInfo.source
          ? { type: 'Source', name: columnInfo.source, schema: columnInfo.schema, ...pos }
          : columnInfo;
    }
  }
  return undefined;
};

export const toLoadedSourceAtOffset = (sql: string, data: LoadedData[], offset: number): LoadedSource | undefined => {
  const ast = parser(sql).ast;
  const path = toPath(ast, offset);
  const query = toQueryInterface(ast);
  const loadedSources = toLoadedContext(data, query.sources);
  const item = toInfo(path);
  return item && item.type === 'SourceColumn'
    ? loadedSources.sources.find((source) => source.name === item.source)
    : undefined;
};

export type QuickInfo = Omit<tss.QuickInfo, 'kind' | 'kindModifiers'>;

export const toQuickInfo = (sql: string, data: LoadedData[], offset: number): QuickInfo | undefined => {
  const ast = parser(sql).ast;
  const path = toPath(ast, offset);
  const query = toQueryInterface(ast);
  const loadedSources = toLoadedContext(data, query.sources);
  const item = toInfo(path);
  if (item) {
    const textSpan = { start: item.start, length: item.end - item.start + 1 };

    switch (item?.type) {
      case 'SourceColumn':
        const type = loadedSources.sources.find((source) => source.name === item.source)?.items[item.name];
        return {
          documentation: [
            { kind: 'keyword', text: 'column' },
            { kind: 'space', text: ' ' },
            { kind: 'text', text: item.name },
            { kind: 'space', text: ' ' },
            { kind: 'type', text: type?.postgresType ?? 'unknown' },
            ...(type && isTypeNullable(type) && !type.nullable
              ? [
                  { kind: 'space', text: ' ' },
                  { kind: 'text', text: 'NOT NULL' },
                ]
              : []),
            ...(type?.comment
              ? [
                  { kind: 'space', text: ' ' },
                  { kind: 'comment', text: type?.comment },
                ]
              : []),
          ],
          textSpan,
        };
      case 'Source':
        const source = loadedSources.sources.find((source) => source.name === item.name);
        return {
          documentation: [
            { kind: 'keyword', text: 'table' },
            { kind: 'space', text: ' ' },
            { kind: 'text', text: source?.type ?? '-' },
          ],
          textSpan,
        };
      default:
        return undefined;
    }
  }
  return undefined;
};
