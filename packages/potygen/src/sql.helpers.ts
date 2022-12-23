/**
 * sql.helpers.ts
 *
 * Helpers that wrap common use cases for the `sql` template literal from [sql.ts](./sql.ts)
 */

import { PotygenNotFoundError } from './errors';
import { toQueryConfig } from './sql';
import { ArrayElement, Query, SqlDatabase, SqlInterface } from './sql.types';

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
  mapResult((rows) => (rows.length ? (rows[0] as ArrayElement<TQueryInterface['result']>) : undefined), query);

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
  mapResult((rows, params): ArrayElement<TQueryInterface['result']> => {
    const result = rows[0];
    if (!result) {
      throw new PotygenNotFoundError(`Must return at least one`, toQueryConfig(query, params));
    }
    return result as ArrayElement<TQueryInterface['result']>;
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
  mapResult((rows, params): TQueryInterface['result'] => {
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
  <TMappedResult, TSqlInterface extends SqlInterface = SqlInterface, TOriginalResult = TSqlInterface['result']>(
    mapper: (rows: TSqlInterface['result'], db: SqlDatabase, params: TSqlInterface['params']) => TMappedResult,
    query: Query<TSqlInterface, TOriginalResult>,
  ): Query<SqlInterface<TMappedResult>, TSqlInterface['result']> =>
  (...args: [db: SqlDatabase, params: TSqlInterface['params']] | []): any => {
    if (args.length === 0) {
      const source = query();
      return {
        ...source,
        mapper: (rows: TOriginalResult, db: SqlDatabase, params: TSqlInterface['params']) =>
          mapper(source.mapper(rows, db, params), db, params),
      };
    } else {
      return query(...args).then((rows) => mapper(rows, ...args));
    }
  };
