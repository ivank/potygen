import { readFileSync } from 'fs';
import { Readable, Writable } from 'stream';
import { glob } from './glob';
import {
  createSourceFile,
  ScriptTarget,
  isTaggedTemplateExpression,
  Node,
  isImportDeclaration,
  isStringLiteral,
  isNoSubstitutionTemplateLiteral,
  isNamedImports,
  SourceFile,
  isIdentifier,
} from 'typescript';
import { basename } from 'path';
import { parser } from '@psql-ts/ast';
import { QueryInterface, toQueryInterface } from '@psql-ts/query';
import { loadQueryInterfacesData, toLoadedQueryInterface } from './load';
import { ClientBase } from 'pg';
import { LoadedData, LoadedFile, ParsedFile, ParsedSqlFile, ParsedTypescriptFile, TemplateTagQuery } from './types';
import { emitLoadedFile } from './emit';
import { LoadError, ParsedSqlFileLoadError, ParsedTypescriptFileLoadError, ParseError } from './errors';

const getTemplateTagQueries = (ast: SourceFile): TemplateTagQuery[] => {
  const queries: TemplateTagQuery[] = [];
  let tagPropertyName = 'sql';

  const visitor = (node: Node): void => {
    if (
      isImportDeclaration(node) &&
      isStringLiteral(node.moduleSpecifier) &&
      node.importClause?.namedBindings &&
      isNamedImports(node.importClause.namedBindings) &&
      node.moduleSpecifier.text === '@psql-ts/query'
    ) {
      tagPropertyName =
        node.importClause?.namedBindings.elements.find(
          ({ propertyName, name }) => (propertyName ?? name).text === 'sql',
        )?.name.text ?? tagPropertyName;
    } else if (
      isTaggedTemplateExpression(node) &&
      isNoSubstitutionTemplateLiteral(node.template) &&
      isIdentifier(node.tag) &&
      node.tag.text === tagPropertyName
    ) {
      const tag = {
        name: node.parent.getChildAt(0).getText(),
        pos: node.template.pos + 1,
        template: node.template.text,
      };
      try {
        const sqlAst = parser(node.template.text);
        if (sqlAst) {
          queries.push({ ...tag, queryInterface: toQueryInterface(sqlAst) });
        }
      } catch (error) {
        throw new ParseError(tag, `Error parsing sql: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      node.forEachChild(visitor);
    }
  };

  visitor(ast);
  return queries;
};

const toParsedTypescriptFile = (path: string): ParsedTypescriptFile => {
  const sourceText = readFileSync(path, 'utf-8');
  const source = createSourceFile(basename(path), sourceText, ScriptTarget.ES2021, true);
  return { type: 'ts', source, path, queries: getTemplateTagQueries(source) };
};

const toParsedSqlFile = (path: string): ParsedSqlFile | undefined => {
  const content = readFileSync(path, 'utf-8');
  const sqlAst = parser(content);
  return sqlAst ? { type: 'sql', path, content, queryInterface: toQueryInterface(sqlAst) } : undefined;
};

const toQueryInterfaces = (files: ParsedFile[]): QueryInterface[] =>
  files.flatMap((file) =>
    file.type === 'ts' ? file.queries.map((query) => query.queryInterface) : file.queryInterface,
  );

const loadDataFromParsedFiles = async (
  db: ClientBase,
  data: LoadedData[],
  files: ParsedFile[],
): Promise<LoadedData[]> => loadQueryInterfacesData(db, toQueryInterfaces(files), data);

const isError = (error: unknown): error is LoadError | ParseError =>
  error instanceof LoadError || error instanceof ParseError;

const loadFile =
  (data: LoadedData[]) =>
  (file: ParsedFile): LoadedFile => {
    if (file.type === 'sql') {
      try {
        return { ...file, loadedQuery: toLoadedQueryInterface(data)(file.queryInterface) };
      } catch (error) {
        throw isError(error) ? new ParsedSqlFileLoadError(file, error) : error;
      }
    } else {
      return {
        ...file,
        queries: file.queries.map((template) => {
          try {
            return { ...template, loadedQuery: toLoadedQueryInterface(data)(template.queryInterface) };
          } catch (error) {
            throw isError(error) ? new ParsedTypescriptFileLoadError(file, template, error) : error;
          }
        }),
      };
    }
  };

export class SqlRead extends Readable {
  public source: Generator<string, void, unknown>;

  constructor(public path: string, public root = '.') {
    super({ objectMode: true });
    this.source = glob(path, root);
  }

  next() {
    let path: IteratorResult<string>;
    do {
      path = this.source.next();
      if (path.value?.endsWith('.ts')) {
        const file = toParsedTypescriptFile(path.value);
        if (file.queries.length > 0) {
          return file;
        }
      } else if (path.value) {
        return toParsedSqlFile(path.value);
      }
    } while (!path.done);
    return undefined;
  }

  _read() {
    this.push(this.next() ?? null);
  }
}

export class QueryLoader extends Writable {
  public data: LoadedData[] = [];
  constructor(public db: ClientBase, public root: string, public template: string) {
    super({ objectMode: true, highWaterMark: 1 });
  }

  async _writev(
    chunks: Array<{ chunk: ParsedFile; encoding: BufferEncoding }>,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      const parsedFiles = chunks.map((file) => file.chunk);
      this.data = await loadDataFromParsedFiles(this.db, this.data, parsedFiles);
      await Promise.all(parsedFiles.map(loadFile(this.data)).map(emitLoadedFile(this.root, this.template)));
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
    callback();
  }

  async _write(
    file: ParsedTypescriptFile,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      this.data = await loadDataFromParsedFiles(this.db, this.data, [file]);
      await emitLoadedFile(this.root, this.template)(loadFile(this.data)(file));
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
    callback();
  }
}