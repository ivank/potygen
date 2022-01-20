import { PotygenNotFoundError } from './errors';
import { toQueryConfig } from './sql';
import { MapQuery, Query, SqlDatabase, SqlInterface } from './sql.types';

/**
 * Return the first element, after the query is run, returns undefined if result is empty
 *
 * ```typescript
 * const showSql = sql<ShowSqlQuery>`
 *   SELECT id, name
 *   FROM table1
 *   WHERE id = $id
 * `;
 * const showQuery = maybeOne(showSql);
 *
 * const myRowItem = await showQuery(db, { id: 12 });
 * ```
 */
export const maybeOne = <TQueryInterface extends SqlInterface>(query: Query<TQueryInterface>) =>
  map((rows) => (rows.length ? rows[0] : undefined), query);

/**
 * Return the first element, useful for queries where we always expect at least one result
 *
 * @throws PotygenRuntimeError if row is empty
 *
 * ```typescript
 * const showSql = sql<ShowSqlQuery>`
 *   INSERT (name)
 *   INTO table1
 *   VALUES ($name)
 *   RETURNING id, name
 * `;
 * const showQuery = one(showSql);
 *
 * const myRowItem = await showQuery(db, { name: 'myNewRow' });
 *
 * ```
 */
export const one = <TQueryInterface extends SqlInterface>(query: Query<TQueryInterface>) =>
  map((rows, params) => {
    const result = rows[0];
    if (!result) {
      throw new PotygenNotFoundError(`Must return at least one`, toQueryConfig(query(), params));
    }
    return result;
  }, query);
/**
 * Return the first element, useful for queries where we always expect at least one result
 *
 * @throws PotygenRuntimeError if row is empty
 *
 * ```typescript
 * const showSql = sql<ShowSqlQuery>`
 *   SELECT id, name
 *   FROM table1
 *   WHERE id = $id
 * `;
 * const idsQuery = map((rows) => rows.map(({ id }) => id)), showSql);
 *
 * const ids = await showQuery(db, { name: 'myNewRow' });
 *
 * ```
 */
export const map =
  <TSqlInterface extends SqlInterface, TResult>(
    predicate: (rows: TSqlInterface['result'][], db: SqlDatabase, params: TSqlInterface['params']) => TResult,
    query: Query<TSqlInterface>,
  ): MapQuery<TSqlInterface, TResult> =>
  (...args: [db: SqlDatabase, params: TSqlInterface['params']] | []): any =>
    args.length === 0 ? query : query(...args).then((rows) => predicate(rows, ...args));
