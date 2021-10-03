import { Parser } from '@ikerin/rd-parse';
import { ClientBase, QueryConfig } from 'pg';
import { toTagParams, Param } from './query-interface';
import { SqlGrammar } from './sql.grammar';
import { DeleteTag, InsertTag, SelectTag, UpdateTag, CombinationTag } from './sql.types';
import { isObject, orderBy } from './util';

export interface Sql {
  params: Record<string, unknown>;
  result: unknown[];
}
const sqlParser = Parser<SelectTag | UpdateTag | DeleteTag | InsertTag | CombinationTag>(SqlGrammar);

export type SqlQueryConfig<TSql extends Sql = Sql> = (params: TSql['params']) => QueryConfig;

export const toParams = (sql: string): Param[] => {
  const ast = sqlParser(sql);
  return ast ? toTagParams(ast).sort(orderBy((p) => p.pos)) : [];
};

const toSpreadIndexParam = (param: Param, index: number, values: unknown): string =>
  Array.isArray(values)
    ? values.every(Array.isArray)
      ? values
          .map(
            (value, groupIndex, group) =>
              '(' + value.map((_, itemIndex) => '$' + (index + groupIndex * group.length + itemIndex)).join(',') + ')',
          )
          .join(',')
      : param.pick.length > 0
      ? values
          .map(
            (_, groupIndex) =>
              '(' + param.pick.map((_, itemIndex) => '$' + (index + groupIndex * param.pick.length + itemIndex)) + ')',
          )
          .join(',')
      : '(' + values.map((_, itemIndex) => '$' + (index + itemIndex)).join(',') + ')'
    : '()';

const toSpreadIndex = (values: unknown): number =>
  Array.isArray(values)
    ? values.every(Array.isArray)
      ? values.reduce((sum, value) => sum + value.length, 0)
      : values.length
    : 0;

export const convertSql = (params: Param[], sql: string, values: Record<string, unknown>): string =>
  params.reduce<{
    sql: string;
    index: number;
    offset: number;
    indexes: Record<string, number>;
  }>(
    (current, param) => {
      const nameLength =
        param.pick.length > 0 ? param.lastPos - param.pos + 1 : param.name.length + (param.spread ? 2 : 1);
      const index = param.spread
        ? current.indexes[param.name] ?? current.index + toSpreadIndex(values[param.name])
        : current.indexes[param.name] ?? current.index + 1;
      const indexParam = param.spread ? toSpreadIndexParam(param, current.index + 1, values[param.name]) : '$' + index;
      const pos = param.pos + current.offset;
      return {
        sql: current.sql.slice(0, pos) + indexParam + current.sql.slice(pos + nameLength),
        index,
        indexes: { ...current.indexes, [param.name]: index },
        offset: indexParam.length + current.offset - nameLength,
      };
    },
    { sql, index: 0, offset: 0, indexes: {} },
  ).sql;

export const convertValues = (params: Param[], values: Record<string, unknown>): unknown[] =>
  params.reduce<{ values: unknown[]; indexes: Record<string, boolean> }>(
    (current, param) => {
      const value = values[param.name];
      return {
        values:
          param.name in current.indexes
            ? current.values
            : [
                ...current.values,
                ...(param.spread && Array.isArray(value)
                  ? param.pick.length > 0
                    ? value.flatMap((item) => (isObject(item) ? param.pick.map(({ name }) => item[name]) : item))
                    : value
                  : [value]),
              ],
        indexes: { ...current.indexes, [param.name]: true },
      };
    },
    { values: [], indexes: {} },
  ).values;

export const toQueryConfig = <TSql extends Sql = Sql>(text: string): SqlQueryConfig<TSql> => {
  const params = toParams(text);
  return (values) => ({ text: convertSql(params, text, values), values: convertValues(params, values) });
};

export const sql = <TSql extends Sql = Sql>([text]: TemplateStringsArray): SqlQueryConfig<TSql> => toQueryConfig(text);

export const query = async <TSql extends Sql>(
  db: ClientBase,
  sqlQueryConfig: SqlQueryConfig<TSql>,
  params: TSql['params'],
): Promise<TSql['result'][]> => (await db.query(sqlQueryConfig(params))).rows;

// interface A {
//   params: { a: string; b: number };
//   result: { other: Date };
// }

// const test1 = sql<A>`asds`;

// const c = new Client();

// const main = async () => {
//   const z = await query(c, test1);
// };
