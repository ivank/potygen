import { parser, isObject, orderBy } from '@psql-ts/ast';
import { ClientBase, QueryConfig } from 'pg';
import { toParams } from './query-interface';
import { Param } from './query-interface.types';
import { Sql } from './sql.types';

const toAstParams = (sql: string): Param[] => {
  const ast = parser(sql);
  return ast ? toParams(ast).sort(orderBy((p) => p.pos)) : [];
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

const convertSql = (params: Param[], sql: string, values: Record<string, unknown>): string =>
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

const convertValues = (params: Param[], values: Record<string, unknown>): unknown[] =>
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

export class PSqlQuery<TSql extends Sql = Sql> {
  public astParams: Param[];
  constructor(public text: string) {
    this.astParams = toAstParams(text);
  }
  toQueryConfig(params: TSql['params'] = {}): QueryConfig<TSql['result'][]> {
    const text = convertSql(this.astParams, this.text, params as Record<string, unknown>);
    const values = convertValues(this.astParams, params as Record<string, unknown>);
    return { text, values };
  }
  async run(db: ClientBase, params: TSql['params'] = {}): Promise<TSql['result'][]> {
    return (await db.query(this.toQueryConfig(params))).rows;
  }
}

export const sql = <TSql extends Sql = Sql>([text]: TemplateStringsArray): PSqlQuery<TSql> => new PSqlQuery(text);

// interface A {
//   params: { a: string; b: number };
//   result: { other: Date };
// }

// const test1 = sql<A>`asds`;

// const c = new Client();

// const main = async () => {
//   const z = await test1.run(c);
// };
