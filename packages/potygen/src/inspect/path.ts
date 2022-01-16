import { findLastIndex } from '../util';
import { isNode } from '../grammar.guards';
import { Tag, SqlTag } from '../grammar.types';
import { PathItem, Path } from '../load.types';

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
    const index = findLastIndex<Tag>((item) => offset >= item.start && offset <= item.end + 1, tag.values);

    if (index !== -1) {
      return toPath(tag.values[index], offset, [{ tag, index }, ...path]);
    } else {
      return [{ tag }, ...path];
    }
  }
  return [{ tag }, ...path];
};
