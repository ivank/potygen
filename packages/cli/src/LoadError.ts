import { Tag } from '@psql-ts/ast';
// import { ParsedSqlFile } from './types';

export class LoadError extends Error {
  constructor(public tag: Tag, message: string) {
    super(message);
  }
}

// export class SourceLoadError extends Error {
//   constructor(public source: ParsedTypescriptTemplateFile | ParsedSqlFile, public error: LoadError) {
//     super(error.message);
//   }
// }
