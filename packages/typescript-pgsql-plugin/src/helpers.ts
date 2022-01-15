export const correctEmptyIdentifierAfterDot = (sql: string, offset: number): string =>
  sql.charAt(offset - 1) === '.' && sql.charAt(offset).match(/\s/)
    ? sql.slice(0, offset) + 'unknown_column' + sql.slice(offset)
    : sql;
