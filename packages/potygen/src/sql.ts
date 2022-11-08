/**
 * sql.ts
 *
 * The `sql` template literal used to perform all the queries.
 * This holds the user fasing interface
 */

import { parser } from './grammar';
import { AstTag } from './grammar.types';
import { isObject, orderBy } from './util';
import { isDatabaseError, PotygenDatabaseError } from './errors';
import { toParams } from './query-interface';
import { typeUnknown } from './postgres-types-map';
import { Param, TypeOrLoad } from './query-interface.types';
import { Query, QuerySource, SqlDatabase, SqlInterface, QueryConfig } from './sql.types';
import { isType, isTypeLoadNamed, isTypeLoadRecord } from './query-interface.guards';

/**
 * Extract the params from an sql {@link AstTag}.
 */
const toParamsFromAst = (ast: AstTag): Param[] =>
  toParams({ type: typeUnknown, columns: [], cteParams: true })(ast).sort(orderBy((p) => p.start));

const toParamPickType = (type: TypeOrLoad | undefined): string =>
  type
    ? isTypeLoadRecord(type)
      ? type.schema
        ? `::${type.schema}.${type.name}`
        : `::${type.name}`
      : type
      ? isTypeLoadNamed(type)
        ? toParamPickType(type.value)
        : isType(type)
        ? `::${type.postgresType}`
        : ''
      : ''
    : '';

/**
 * Convert a "spread" {@link Param} into params that pg node package will accept
 *
 * $$param -> ($1,$2,$3), ($4,$5,$6)
 */
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
              '(' +
              param.pick.map(
                (pick, itemIndex) =>
                  '$' + (index + groupIndex * param.pick.length + itemIndex) + toParamPickType(pick.castType),
              ) +
              ')',
          )
          .join(',')
      : '(' + values.map((_, itemIndex) => '$' + (index + itemIndex)).join(',') + ')'
    : '()';

/**
 * Figure out what the index will be after a spread
 */
const toSpreadIndex = (param: Param, values: unknown): number =>
  Array.isArray(values)
    ? values.reduce(
        (sum, value) => sum + (Array.isArray(value) ? value.length : isObject(value) ? param.pick.length : 1),
        0,
      )
    : 0;

/**
 * Convert sql string by "spreading" the parameters into a flat list that pg package can interpret.
 * Requies the query to be parsed first and to get params from {@link QueryInterface}
 *
 * ```sql
 * SELECT * FROM id = $param AND age > $age
 * ```
 * Is converted into:
 * ```sql
 * SELECT * FROM id = $1 AND age > $2
 * ```
 *
 */
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
      const newIndex = param.spread ? current.index + toSpreadIndex(param, values[param.name]) : current.index + 1;
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

/**
 * Convert recieved params objects into the flat array of values that pg package requires
 */
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

/**
 * PG package returns "null" values, this efficiently converts all `null`s into `undefined`s
 */
const nullToUndefinedInPlace = (row: Record<string, unknown>): Record<string, unknown> => {
  for (const key in row) {
    const val = row[key];
    if (val === null) {
      row[key] = undefined;
    } else if (isObject(val) && row.hasOwnProperty(key)) {
      row[key] = nullToUndefinedInPlace(val);
    }
  }
  return row;
};

/**
 * Use the intermediary parsing result {@link QuerySource} to compute a {@link QueryConfig}
 * that can be passed to {@link SqlDatabase}'s query function
 */
const toQueryConfigFromSource = <TSqlInterface extends SqlInterface = SqlInterface>(
  querySource: QuerySource,
  params: TSqlInterface['params'],
): QueryConfig => ({
  text: convertSql(querySource.params, querySource.sql, params as Record<string, unknown>),
  values: convertValues(querySource.params, params as Record<string, unknown>),
});

/**
 * Compute a {@link QueryConfig} from an sql template that can be passed to {@link SqlDatabase}'s query function
 */
export const toQueryConfig = <TSqlInterface extends SqlInterface = SqlInterface>(
  query: Query<TSqlInterface>,
  params: TSqlInterface['params'],
): QueryConfig => toQueryConfigFromSource(query(), params);

export const toQuery = <TSqlInterface extends SqlInterface = SqlInterface>(sql: string): Query<TSqlInterface> => {
  try {
    const { ast } = parser(sql);
    const params = toParamsFromAst(ast);

    return (...args: [db: SqlDatabase, params: TSqlInterface['params']] | []): any => {
      const source = { sql, ast, params };
      if (args.length === 0) {
        return source;
      }

      const query = toQueryConfigFromSource<TSqlInterface>(source, args[1]);

      return args[0]
        .query(query)
        .then((result) => ('rows' in result ? result.rows : result).map(nullToUndefinedInPlace))
        .catch((error) => {
          throw error instanceof Error && isDatabaseError(error) ? new PotygenDatabaseError(error, query) : error;
        });
    };
  } catch (e) {
    console.log(String(e));
    throw e;
  }
};

/**
 * Sql Query. Pass it the {@link SqlInterface} generated with [@potygen/cli](https://github.com/ivank/potygen/tree/main/packages/cli)
 */
export const sql = <TSqlInterface extends SqlInterface = SqlInterface>([
  text,
]: TemplateStringsArray): Query<TSqlInterface> => toQuery(text);
