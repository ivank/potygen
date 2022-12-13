/**
 * sql.helpers.ts
 *
 * Helpers that wrap common use cases for the `sql` template literal from [sql.ts](./sql.ts)
 */

import { PotygenNotFoundError } from './errors';
import { toQueryConfig } from './sql';
import { Query, SqlDatabase, SqlInterface } from './sql.types';

/**
 * Return the first element, after the query is run, returns undefined if result is empty
 *
 * ```typescript
 * const showSql = sql<ShowSqlQuery>`
 *   SELECT id, name
 *   FROM table1
 *   WHERE id = $id
 * `;
 * const showQuery = maybeOneResult(showSql);
 *
 * const myRowItem = await showQuery(db, { id: 12 });
 * ```
 */
export const maybeOneResult = <TQueryInterface extends SqlInterface<unknown[]>>(query: Query<TQueryInterface>) =>
  mapResult((rows) => (rows.length ? rows[0] : undefined), query);

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
 * const showQuery = oneResult(showSql);
 *
 * const myRowItem = await showQuery(db, { name: 'myNewRow' });
 *
 * ```
 */
export const oneResult = <TQueryInterface extends SqlInterface<unknown[]>>(query: Query<TQueryInterface>) =>
  mapResult((rows, params) => {
    const result = rows[0];
    if (!result) {
      throw new PotygenNotFoundError(`Must return at least one`, toQueryConfig(query, params));
    }
    return result;
  }, query);

/**
 * Return the rows but throw an error if no rows have been returned
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
 * const showQuery = atLeastOneResult(showSql);
 *
 * const myRowItem = await showQuery(db, { name: 'myNewRow' });
 *
 * ```
 */
export const atLeastOneResult = <TQueryInterface extends SqlInterface<unknown[]>>(query: Query<TQueryInterface>) =>
  mapResult((rows, params) => {
    if (rows.length < 1) {
      throw new PotygenNotFoundError(`Must return at least one`, toQueryConfig(query, params));
    }
    return rows;
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
export const mapResult =
  <TOriginalSqlInterface extends SqlInterface, TResultSqlInterface extends SqlInterface>(
    mapper: (
      rows: TOriginalSqlInterface['result'],
      db: SqlDatabase,
      params: TOriginalSqlInterface['params'],
    ) => TResultSqlInterface['result'],
    query: Query<TOriginalSqlInterface>,
  ): Query<TResultSqlInterface, TOriginalSqlInterface> =>
  (...args: [db: SqlDatabase, params: TOriginalSqlInterface['params']] | []): any =>
    args.length === 0 ? { ...query, mapper } : query(...args).then((rows) => mapper(rows, ...args));
