import { parser } from './grammar';
import { AstTag } from './grammar.types';
import { isObject, orderBy } from './util';
import { isDatabaseError, PotygenDatabaseError } from './errors';
import { toParams } from './query-interface';
import { typeUnknown } from './postgres-types-map';
import { Param } from './query-interface.types';
import { Query, QuerySource, SqlDatabase, SqlInterface, QueryConfig } from './sql.types';

const toParamsFromAst = (ast: AstTag): Param[] =>
  toParams({ type: typeUnknown, columns: [] })(ast).sort(orderBy((p) => p.start));

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
    ? values.reduce(
        (sum, value) => sum + (Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 1),
        0,
      )
    : 0;

const convertSql = (params: Param[], sql: string, values: Record<string, unknown>): string =>
  params.reduce<{
    sql: string;
    index: number;
    offset: number;
    indexes: Record<string, number>;
  }>(
    (current, param) => {
      const nameLength = param.end - param.start + 1;
      const reusedIndex = current.indexes[param.name];
      const newIndex = param.spread ? current.index + toSpreadIndex(values[param.name]) : current.index + 1;
      const index = reusedIndex ?? newIndex;
      const nextIndex = reusedIndex ? current.index : newIndex;

      const indexParam = param.spread ? toSpreadIndexParam(param, current.index + 1, values[param.name]) : '$' + index;
      const pos = param.start + current.offset;
      return {
        sql: current.sql.slice(0, pos) + indexParam + current.sql.slice(pos + nameLength),
        index: nextIndex,
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

const nullToUndefinedInPlace = (row: Record<string, unknown>): Record<string, unknown> => {
  for (const key in row) {
    if (row[key] === null) {
      row[key] = undefined;
    }
  }
  return row;
};

const toQueryConfigFromSource = <TSqlInterface extends SqlInterface = SqlInterface>(
  querySource: QuerySource,
  params: TSqlInterface['params'],
): QueryConfig => ({
  text: convertSql(querySource.params, querySource.sql, params as Record<string, unknown>),
  values: convertValues(querySource.params, params as Record<string, unknown>),
});

export const toQueryConfig = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  params: TSqlInterface['params'],
): QueryConfig => toQueryConfigFromSource(query(), params);

export const toQuery = <TSqlInterface extends SqlInterface = SqlInterface>(sql: string): Query<TSqlInterface> => {
  const { ast } = parser(sql);
  const params = toParamsFromAst(ast);

  return (...args: [db: SqlDatabase, params: TSqlInterface['params']] | []): any => {
    const source = { sql, ast, params };
    if (args.length === 0) {
      return source;
    }

    const query = toQueryConfigFromSource<TSqlInterface>(source, args[1]);

    try {
      return args[0].query(query).then(({ rows }) => rows.map(nullToUndefinedInPlace));
    } catch (error) {
      if (error instanceof Error && isDatabaseError(error)) {
        throw new PotygenDatabaseError(error, query);
      } else {
        throw error;
      }
    }
  };
};

export const sql = <TSqlInterface extends SqlInterface = SqlInterface>([
  text,
]: TemplateStringsArray): Query<TSqlInterface> => toQuery(text);
