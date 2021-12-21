import { DatabaseError, QueryConfig } from 'pg';
import { markTextError } from '@ikerin/rd-parse';

export class PotygenError extends Error {
  constructor(message: string, public query: QueryConfig) {
    super(message);
  }

  toString() {
    return `Error: ${this.message}

Potygen Error Code
--------------------
${this.query.text}`;
  }
}

export class PotygenDatabaseError extends PotygenError {
  constructor(public databaseError: DatabaseError, query: QueryConfig) {
    super(databaseError.message, query);
  }

  toString() {
    const text = this.query.text;
    const position = this.databaseError.position ? Number(this.databaseError.position) : 0;
    const template = this.databaseError.position ? markTextError(text, this.message, position) : text;
    return `Error: ${this.message}

Potygen Error Code: ${this.databaseError.code}
--------------------
${template}`;
  }
}

export class PotygenNotFoundError extends PotygenError {}
