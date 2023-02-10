/**
 * path.ts
 *
 * The ast "path" is a data structure to hold both an sql tag, as well as a "stack" of all of its parents,
 * so we can quickly understand where a tag comes from.
 */

import { findLastIndex } from '../util';
import { isNode } from '../grammar.guards';
import { Tag, SqlTag } from '../grammar.types';
import { PathItem, Path } from '../load.types';

const isItem =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (item: PathItem<Tag>): item is PathItem<T> =>
    predicate(item.tag);

/**
 * Find the closest parent {@link Tag} (using predicate)
 */
export const closestParent =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): T | undefined =>
    path.find(isItem(predicate))?.tag;

/**
 * Find the closest parent {@link Path} (using predicate)
 */
export const closestParentPath =
  <T extends Tag>(predicate: (tag: SqlTag) => tag is T) =>
  (path: Path): PathItem<T> | undefined =>
    path.find(isItem(predicate));

/**
 * Search for the deepest tag within a tree at a given position
 */
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
