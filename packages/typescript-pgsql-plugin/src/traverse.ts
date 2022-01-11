import { Tag, isNode, isFunction, isColumn, isQualifiedIdentifier, SqlTag } from '@potygen/ast';

export interface PathItem<T extends Tag> {
  index?: number;
  tag: T;
}
export type Path = PathItem<Tag>[];

export interface SourceItemTable {
  schema: string;
  table: string;
}
export interface SourceItemNamed {
  name: string;
}

export type SourceItem = SourceItemTable | SourceItemNamed;

const isItem =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (item: PathItem<Tag>): item is PathItem<T> =>
    predicate(item.tag);

const closestParent =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): T | undefined =>
    path.find(isItem(predicate))?.tag;

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
const closestParentColumn = closestParent(isColumn);

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

export const getSourceItem = (path: Path): SourceItem | undefined => {
  const parentColumn = closestParentColumn(path);
  if (parentColumn) {
    return parentColumn.values.length === 2
      ? { schema: parentColumn.values[0].value, table: parentColumn.values[1].value }
      : parentColumn.values.length === 1
      ? { name: parentColumn.values[0].value }
      : undefined;
  }
  return undefined;
};
