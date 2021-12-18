import { DatabaseError, QueryConfig } from 'pg';
import { markTextError } from '@ikerin/rd-parse';

export class RunQueryError extends Error {
  constructor(public databaseError: DatabaseError, public query: QueryConfig) {
    super(databaseError.message);
  }

  toString() {
    const text = this.query.text;
    const position = this.databaseError.position ? Number(this.databaseError.position) : 0;
    const template = this.databaseError.position ? markTextError(text, this.message, position) : text;
    return `Error: ${this.message}

Postgres Error Code: ${this.databaseError.code}
--------------------
${template}`;
  }
}
