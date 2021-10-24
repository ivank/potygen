import { Tag } from '@psql-ts/ast';
import { ParsedTypescriptFile, ParsedSqlFile, TemplateTagQuery } from './types';

const markSqlError = (text: string, message: string, pos: number, nextPos: number): string => {
  const nextNewLinePos = text.indexOf('\n', pos);
  const prevNewLinePos = text.lastIndexOf('\n', pos);
  const indent = ' '.repeat(pos - prevNewLinePos);
  return text.slice(0, nextNewLinePos) + `\n${indent}^\n${indent}| ${message}\n` + text.slice(nextNewLinePos);
};

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
    const template =
      this.error instanceof LoadError
        ? markSqlError(text, this.message, this.error.tag.pos, this.error.tag.nextPos)
        : text;
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
    const template =
      this.error instanceof LoadError
        ? markSqlError(text, this.message, this.error.tag.pos, this.error.tag.nextPos)
        : text;

    return `Error: ${this.message}

File: ${this.file.path}
--------------------
${template}`;
  }
}
