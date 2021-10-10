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
import { toQueryInterface } from '@psql-ts/query';
import { loadQueries } from '.';
import { ClientBase } from 'pg';
import { defaultContext } from './load-types';
import { Context, LoadedParsedTypescriptFile, ParsedTypescriptFile, TemplateTagQuery } from './types';
import { emitLoadedParsedTypescriptFile } from './emit';

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
      const sqlAst = parser(node.template.text);
      if (sqlAst) {
        const queryInterface = toQueryInterface(sqlAst);
        queries.push({
          name: node.parent.getChildAt(0).getText(),
          pos: node.template.pos + 1,
          template: node.template.text,
          queryInterface,
        });
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
  return { source, path, queries: getTemplateTagQueries(source) };
};

const loadParsedTypescriptFiles = async (
  db: ClientBase,
  context: Context,
  files: ParsedTypescriptFile[],
): Promise<{ context: Context; files: LoadedParsedTypescriptFile[] }> => {
  const loaded = await loadQueries(
    db,
    files.flatMap((file) => file.queries.map((query) => query.queryInterface)),
    context,
  );

  return {
    files: files.map((file) => ({
      ...file,
      queries: file.queries.map((query) => ({ ...query, loadedQuery: loaded.queries.shift()! })),
    })),
    context: loaded.context,
  };
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
      }
    } while (!path.done);
    return undefined;
  }

  _read() {
    this.push(this.next() ?? null);
  }
}

export class QueryLoader extends Writable {
  public context = defaultContext;
  constructor(public db: ClientBase, public root: string, public template: string) {
    super({ objectMode: true });
  }

  async _writev(
    chunks: Array<{ chunk: ParsedTypescriptFile; encoding: BufferEncoding }>,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    const parsedFiles = chunks.map((file) => file.chunk);
    const { context, files } = await loadParsedTypescriptFiles(this.db, this.context, parsedFiles);
    this.context = context;
    files.forEach(emitLoadedParsedTypescriptFile(this.root, this.template));
    callback();
  }

  async _write(
    file: ParsedTypescriptFile,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    const { context, files } = await loadParsedTypescriptFiles(this.db, this.context, [file]);
    this.context = context;
    files.forEach(emitLoadedParsedTypescriptFile(this.root, this.template));
    callback();
  }
}
