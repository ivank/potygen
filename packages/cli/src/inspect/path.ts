import { Tag, isNode, SqlTag } from '@potygen/ast';
import { PathItem, Path } from '../types';

const isItem =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (item: PathItem<Tag>): item is PathItem<T> =>
    predicate(item.tag);

export const closestParent =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): T | undefined =>
    path.find(isItem(predicate))?.tag;

export const closestParentPath =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): PathItem<T> | undefined =>
    path.find(isItem(predicate));

export const toPath = (tag: Tag, offset: number, path: Path = []): Path | undefined => {
  if (isNode(tag)) {
    const index = (tag.values as Tag[]).findIndex((item) => offset >= item.start && offset <= item.end + 1);

    if (index !== -1) {
      return toPath(tag.values[index], offset, [{ tag, index }, ...path]);
    } else {
      return [{ tag }, ...path];
    }
  }
  return [{ tag }, ...path];
};
