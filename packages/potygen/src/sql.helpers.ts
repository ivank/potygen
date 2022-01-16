import { PotygenNotFoundError } from './errors';
import { Sql, SqlMap } from './sql';
import { SqlInterface } from './sql.types';

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
export const maybeOne = <TQueryInterface extends SqlInterface>(sql: Sql<TQueryInterface>) =>
  new SqlMap<TQueryInterface, TQueryInterface['result'] | undefined>(sql, (rows) =>
    rows.length ? rows[0] : undefined,
  );

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
export const one = <TQueryInterface extends SqlInterface>(sql: Sql<TQueryInterface>) =>
  new SqlMap<TQueryInterface, TQueryInterface['result']>(sql, (rows) => {
    const result = rows[0];
    if (!result) {
      throw new PotygenNotFoundError('Must return at least one', sql.toQueryConfig(rows));
    }
    return result;
  });

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
export const map = <TQueryInterface extends SqlInterface, TResult>(
  predicate: (rows: TQueryInterface['result'][]) => TResult,
  sql: Sql<TQueryInterface>,
) => new SqlMap<TQueryInterface, TResult>(sql, predicate);
