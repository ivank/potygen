import { markTextError } from '@ikerin/rd-parse';
import { ParsedTypescriptFile, ParsedSqlFile, TemplateTagQuery } from './load.types';
import { QueryConfig } from './sql.types';
import { Tag } from './grammar.types';

export class DatabaseError extends Error {
  public position?: number;
  public code?: number;
}

export const isDatabaseError = (error: Error): error is DatabaseError => 'position' in error;

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

export class LoadError extends Error {
  constructor(public tag: Tag, message: string) {
    super(message);
  }
}

export class ParseError extends Error {
  constructor(public tag: Omit<TemplateTagQuery, 'queryInterface'>, message: string) {
    super(message);
  }
}

export class ParsedTypescriptFileLoadError extends Error {
  constructor(
    public file: ParsedTypescriptFile,
    public template: TemplateTagQuery,
    public error: LoadError | ParseError,
  ) {
    super(error.message);
  }

  toString() {
    const text = this.template.template;
    const template = this.error instanceof LoadError ? markTextError(text, this.message, this.error.tag.end) : text;
    return `Error: ${this.message}

File: ${this.file.path} (${this.template.pos})
TemplateTag: ${this.template.name}
--------------------
${template}`;
  }
}

export class ParsedSqlFileLoadError extends Error {
  constructor(public file: ParsedSqlFile, public error: LoadError | ParseError) {
    super(error.message);
  }

  toString() {
    const text = this.file.content;
    const template = this.error instanceof LoadError ? markTextError(text, this.message, this.error.tag.end) : text;

    return `Error: ${this.message}

File: ${this.file.path}
--------------------
${template}`;
  }
}
