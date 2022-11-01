import { readFileSync, watchFile } from 'fs';
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
  isCallExpression,
} from 'typescript';
import { basename, relative } from 'path';
import {
  parser,
  QueryInterface,
  toQueryInterface,
  loadQueryInterfacesData,
  toLoadedQueryInterface,
  LoadError,
  ParsedSqlFileLoadError,
  ParsedTypescriptFileLoadError,
  ParseError,
  LoadContext,
  LoadedData,
  LoadedFile,
  Logger,
  ParsedFile,
  ParsedSqlFile,
  ParsedTypescriptFile,
  TemplateTagQuery,
  loadAllData,
} from '@potygen/potygen';
import { ClientBase } from 'pg';
import { emitLoadedFile } from './emit';
import { inspect } from 'util';

const toTemplateParent = (node: Node): Node =>
  isCallExpression(node.parent) ? toTemplateParent(node.parent) : node.parent;

const getTemplateTagQueries = (ast: SourceFile): TemplateTagQuery[] => {
  const queries: TemplateTagQuery[] = [];
  let tagPropertyName = 'sql';

  const visitor = (node: Node): void => {
    if (
      isImportDeclaration(node) &&
      isStringLiteral(node.moduleSpecifier) &&
      node.importClause?.namedBindings &&
      isNamedImports(node.importClause.namedBindings) &&
      node.moduleSpecifier.text === '@potygen/potygen'
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
        name: toTemplateParent(node).getChildAt(0).getText(),
        pos: node.template.pos + 1,
        template: node.template.text,
      };
      try {
        queries.push({ ...tag, queryInterface: toQueryInterface(parser(node.template.text).ast) });
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
  return { type: 'sql', path, content, queryInterface: toQueryInterface(parser(content).ast) };
};

const toQueryInterfaces = (files: ParsedFile[]): QueryInterface[] =>
  files.flatMap((file) =>
    file.type === 'ts' ? file.queries.map((query) => query.queryInterface) : file.queryInterface,
  );

const loadDataFromParsedFiles = async (
  ctx: LoadContext,
  data: LoadedData[],
  files: ParsedFile[],
): Promise<LoadedData[]> => loadQueryInterfacesData(ctx, toQueryInterfaces(files), data);

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

const parseFile = (path: string): ParsedFile | undefined => {
  if (path.endsWith('.ts')) {
    const file = toParsedTypescriptFile(path);
    return file.queries.length > 0 ? file : undefined;
  } else {
    return toParsedSqlFile(path);
  }
};

export class SqlRead extends Readable {
  public source: Generator<string, void, unknown>;
  public watchedFiles = new Set<string>();

  constructor(public options: { path: string; root: string; watch: boolean; logger: Logger }) {
    super({ objectMode: true });
    this.source = glob(options.path, options.root);
  }

  next() {
    let path: IteratorResult<string>;
    while (!(path = this.source.next()).done) {
      const file = parseFile(path.value);
      if (file) {
        return file;
      }
    }
    return undefined;
  }

  watchFile(path: string): () => void {
    return () => {
      const file = parseFile(path);
      if (file) {
        this.options.logger.info(`Processing ${relative(this.options.root ?? '.', path)}`);
        this.push(file);
      }
    };
  }

  _read() {
    const next = this.next();
    if (next) {
      if (this.options.watch && !this.watchedFiles.has(next.path)) {
        this.watchedFiles.add(next.path);
        watchFile(next.path, this.watchFile(next.path));
      }
      this.options.logger.info(`Processing ${relative(this.options.root ?? '.', next.path)}`);
      this.push(next);
    } else if (!this.options.watch) {
      this.options.logger.info(`Done`);
      this.push(null);
    }
  }
}

export class QueryLoader extends Writable {
  public ctx: LoadContext;
  public data: LoadedData[] = [];
  constructor(
    public options: {
      db: ClientBase;
      root: string;
      template: string;
      logger: Logger;
      typePrefix?: string;
      preload?: boolean;
    },
  ) {
    super({ objectMode: true });
    this.ctx = { db: options.db, logger: options.logger ?? console };
  }

  async _writev(
    chunks: Array<{ chunk: ParsedFile; encoding: BufferEncoding }>,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      const parsedFiles = chunks.map((file) => file.chunk);
      this.ctx.logger.debug(
        `Parse files: ${inspect(
          parsedFiles.map((file) => `${relative(this.options.root, file.path)} (${file.type})`),
        )}`,
      );
      this.data = this.options.preload
        ? this.data.length === 0
          ? await loadAllData(this.ctx, this.data)
          : this.data
        : await loadDataFromParsedFiles(this.ctx, this.data, parsedFiles);
      await Promise.all(
        parsedFiles
          .map(loadFile(this.data))
          .map(emitLoadedFile(this.options.root, this.options.template, this.options.typePrefix)),
      );
    } catch (error) {
      this.options.logger.error(error instanceof Error ? String(error) : new Error(String(error)));
    }
    callback();
  }

  async _write(
    file: ParsedTypescriptFile,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      this.ctx.logger.debug(`Parse file: ${relative(this.options.root, file.path)} (${file.type})`);
      this.data = this.options.preload
        ? this.data.length === 0
          ? await loadAllData(this.ctx, this.data)
          : this.data
        : await loadDataFromParsedFiles(this.ctx, this.data, [file]);
      await emitLoadedFile(
        this.options.root,
        this.options.template,
        this.options.typePrefix,
      )(loadFile(this.data)(file));
    } catch (error) {
      this.options.logger.error(error instanceof Error ? String(error) : new Error(String(error)));
    }
    callback();
  }
}
