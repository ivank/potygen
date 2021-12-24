import { markTextError } from '@ikerin/rd-parse';
import { Tag } from '@potygen/ast';
import { ParsedTypescriptFile, ParsedSqlFile, TemplateTagQuery } from './types';

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
