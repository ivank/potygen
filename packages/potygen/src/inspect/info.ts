/**
 * info.ts
 *
 * Convert [path.ts](./path.ts) data into actual viewable introspaction details
 */

import {
  isColumn,
  isIdentifier,
  isBinaryExpression,
  isString,
  isTable,
  isSetItem,
  isQualifiedIdentifier,
  isColumns,
  isInsert,
  isPgCast,
  isFunction,
} from '../grammar.guards';
import { Tag } from '../grammar.types';
import { Path } from '../load.types';
import { last } from '../util';
import { closestParent, closestParentPath, toPath } from './path';

interface InfoBase {
  type: string;
  start: number;
  end: number;
}

interface InfoColumn extends InfoBase {
  type: 'Column';
  name: string;
  source?: string;
  schema?: string;
}
interface InfoEnumVariant extends InfoBase {
  type: 'EnumVariant';
  column: InfoColumn;
}
interface InfoSource extends InfoBase {
  type: 'Source';
  name: string;
  schema?: string;
}
interface InfoTable extends InfoBase {
  type: 'Table';
  name: string;
  schema?: string;
}
interface InfoSchema extends InfoBase {
  name: string;
  type: 'Schema';
}
interface InfoCast extends InfoBase {
  name: string;
  type: 'Cast';
}
interface InfoFunction extends InfoBase {
  name: string;
  type: 'Function';
  schema?: string;
}

/**
 * The closest point of interest at a given position
 */
export type Info = InfoColumn | InfoSource | InfoSchema | InfoTable | InfoEnumVariant | InfoCast | InfoFunction;

const closestIdentifier = closestParent(isIdentifier);
const closestColumnPath = closestParentPath(isColumn);
const closestFunctionPath = closestParentPath(isFunction);
const closestTablePath = closestParentPath(isTable);
const closestSetItem = closestParent(isSetItem);
const closestQualifiedIdentifierPath = closestParentPath(isQualifiedIdentifier);
const closestBinaryExpressionPath = closestParentPath(isBinaryExpression);
const closestString = closestParent(isString);
const closestColumns = closestParent(isColumns);
const closestInsert = closestParent(isInsert);
const closestPgCastPath = closestParentPath(isPgCast);

const toPos = ({ start, end }: Tag): { start: number; end: number } => ({ start, end });

/**
 * Determine the closest point of interest ({@link Info}) from a path to a given position in the sql AST
 */
export const pathToInfo = (path: Path): Info | undefined => {
  const identifier = closestIdentifier(path);

  if (identifier) {
    const parentColumnPath = closestColumnPath(path);
    if (parentColumnPath) {
      const index = parentColumnPath.index;
      const parts = parentColumnPath.tag.values;

      if (parts.length === 1 && index === 0) {
        return { type: 'Column', name: parts[0].value, ...toPos(parts[0]) };
      } else if (parts.length === 2 && index === 0) {
        return { type: 'Source', name: parts[0].value, ...toPos(parts[0]) };
      } else if (parts.length === 2 && index === 1) {
        return { type: 'Column', source: parts[0].value, name: parts[1].value, ...toPos(parts[1]) };
      } else if (parts.length === 3 && index === 0) {
        return { type: 'Schema', name: parts[0].value, ...toPos(parts[0]) };
      } else if (parts.length === 3 && index === 1) {
        return { type: 'Source', schema: parts[0].value, name: parts[1].value, ...toPos(parts[1]) };
      } else if (parts.length === 3 && index === 2) {
        return {
          type: 'Column',
          schema: parts[0].value,
          source: parts[1].value,
          name: parts[2].value,
          ...toPos(parts[2]),
        };
      }
    }

    const columns = closestColumns(path);
    if (columns) {
      const insert = closestInsert(path);
      const table = insert?.values.find(isTable);
      if (insert && table) {
        return {
          type: 'Column',
          schema: table.values[0].values.length === 2 ? table.values[0].values[0].value : undefined,
          source: last(table.values[0].values).value,
          name: identifier.value,
          ...toPos(identifier),
        };
      }
    }

    const setItem = closestSetItem(path);
    if (setItem) {
      return { type: 'Column', name: setItem.values[0].value, ...toPos(setItem.values[0]) };
    }

    const tablePath = closestTablePath(path);
    if (tablePath) {
      if (tablePath.index === 0) {
        const qualifedIdentifier = closestQualifiedIdentifierPath(path);
        if (qualifedIdentifier) {
          const index = qualifedIdentifier.index;
          const parts = qualifedIdentifier.tag.values;

          if (parts.length === 1 && index === 0) {
            return { type: 'Table', name: parts[0].value, ...toPos(parts[0]) };
          } else if (parts.length === 2 && index === 0) {
            return { type: 'Schema', name: parts[0].value, ...toPos(parts[0]) };
          } else if (parts.length === 2 && index === 1) {
            return { type: 'Table', schema: parts[0].value, name: parts[1].value, ...toPos(parts[1]) };
          }
        }
      } else if (tablePath.index === 1 && tablePath.tag.values.length === 2) {
        return { type: 'Source', name: tablePath.tag.values[1].values[0].value, ...toPos(tablePath.tag.values[1]) };
      }
    }

    const pgCastPath = closestPgCastPath(path);
    if (pgCastPath && pgCastPath.index === 1) {
      return { type: 'Cast', name: identifier.value, ...toPos(identifier) };
    }

    const fun = closestFunctionPath(path);
    if (fun) {
      const parts = fun.tag.values[0].values;
      if (parts.length === 1) {
        return { type: 'Function', name: parts[0].value, ...toPos(fun.tag) };
      } else {
        return { type: 'Function', schema: parts[0].value, name: parts[1].value, ...toPos(fun.tag) };
      }
    }
  }

  const str = closestString(path);
  if (str) {
    const binaryExpressionPath = closestBinaryExpressionPath(path);
    const oppositeBinaryArgument =
      binaryExpressionPath?.tag.values[0] === str
        ? binaryExpressionPath?.tag.values[2]
        : binaryExpressionPath?.tag.values[0];
    if (binaryExpressionPath && oppositeBinaryArgument && isColumn(oppositeBinaryArgument)) {
      const oppositeBinaryArgumentPath = toPath(binaryExpressionPath.tag, oppositeBinaryArgument.end - 1);
      if (oppositeBinaryArgumentPath) {
        const otherInfo = pathToInfo(oppositeBinaryArgumentPath);
        if (otherInfo?.type === 'Column') {
          return { type: 'EnumVariant', column: otherInfo, ...toPos(str) };
        }
      }
    }
  }

  return undefined;
};
