import { existsSync } from 'fs';
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
import { basename, dirname, relative } from 'path';
import {
  parser,
  toQueryInterface,
  toLoadedQueryInterface,
  LoadError,
  ParsedSqlFileLoadError,
  ParsedTypescriptFileLoadError,
  ParseError,
  LoadContext,
  LoadedData,
  LoadedFile,
  ParsedFile,
  TemplateTagQuery,
  loadAllData,
  toMilliseconds,
} from '@potygen/potygen';
import { toTypeScriptPrinter } from './typescript-printer';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { createHash } from 'crypto';

/**
 * Handle both "last updated" checks on files as well as actually checking file contents.
 */
export class CacheStore {
  public contents = new Map<string, { path: string; content: string } | undefined>();
  public updates = new Map<string, number>();

  constructor(
    /**
     * Path to the cache file
     */
    public fileName: string,
    /**
     * If enabled is false, do not perform any caching
     */
    public enabled: boolean = false,
    /**
     * If true, initialize the cache with empty values so that after save everything is overwritten
     */
    public cacheClear: boolean = false,
    /**
     * Current version of the cache, if version mismatch, clear the cache
     */
    public cacheVersion = '1.0',
  ) {}

  /**
   * Check the file's last modified time (mtime).
   * If its after the time stored in cache, consider the file stale.
   */
  public async isStale(path: string): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }
    const mtime = (await stat(path)).mtime.getTime();
    const currentMtime = this.updates.get(path);
    return !(currentMtime && mtime === currentMtime);
  }

  /**
   * For a given path and file content, check if content is present in the cache.
   * If it is not, run the process function and store the results in the cache,
   * keyed by md5 of the initial content
   */
  public async cachedOrProcessed(
    path: string,
    content: string,
    process: (path: string, content: string) => Promise<{ path: string; content: string } | undefined>,
  ): Promise<{ path: string; content: string; isCached?: boolean } | undefined> {
    if (!this.enabled) {
      return await process(path, content);
    }
    const key = createHash('md5').update(content).digest('hex');
    const cached = this.contents.get(key);
    const mtime = (await stat(path)).mtime.getTime();
    if (cached) {
      this.updates.set(path, mtime);
      return { ...cached, isCached: true };
    } else {
      const processed = await process(path, content);
      const mtime = (await stat(path)).mtime.getTime();
      this.contents.set(key, processed);
      this.updates.set(path, mtime);
      return processed;
    }
  }

  /**
   * Load the cache from file
   */
  public async load(): Promise<void> {
    if (!this.cacheClear && existsSync(this.fileName)) {
      const cache = JSON.parse(await readFile(this.fileName, 'utf-8'));
      if (typeof cache === 'object' && cache !== null && 'version' in cache && cache.version === this.cacheVersion) {
        this.updates = new Map(Object.entries(cache.updates));
        this.contents = new Map(Object.entries(cache.contents));
      }
    }
  }

  /**
   * Save current state in the cache file
   */
  public async save() {
    await mkdir(dirname(this.fileName), { recursive: true });
    await writeFile(
      this.fileName,
      JSON.stringify({
        updates: Object.fromEntries(this.updates),
        contents: Object.fromEntries(this.contents),
        version: this.cacheVersion,
      }),
      'utf-8',
    );
  }
}

const toTemplateParent = (node: Node): Node =>
  isCallExpression(node.parent) ? toTemplateParent(node.parent) : node.parent;

/**
 * Extract the sql tagged template literals from a typescript ast
 */
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
        throw new ParseError(tag, `Error parsing sql: ${String(error)}`);
      }
    } else {
      node.forEachChild(visitor);
    }
  };

  visitor(ast);
  return queries;
};

const parseFile = (path: string, content: string): ParsedFile | undefined => {
  if (path.endsWith('.ts')) {
    const source = createSourceFile(basename(path), content, ScriptTarget.ES2021, true);
    const file: ParsedFile = { type: 'ts', source, path, queries: getTemplateTagQueries(source) };
    return file.queries.length > 0 ? file : undefined;
  } else {
    return { type: 'sql', path, content, queryInterface: toQueryInterface(parser(content).ast) };
  }
};

const isError = (error: unknown): error is LoadError | ParseError =>
  error instanceof LoadError || error instanceof ParseError;

const toLoadFile =
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

export const toEmitter = async (
  ctx: LoadContext,
  cacheStore: CacheStore,
  options: { root: string; template: string; typePrefix?: string },
) => {
  const data = await loadAllData(ctx, []);
  const loadFile = toLoadFile(data);
  const typeScriptPrinter = toTypeScriptPrinter(options.root, options.template, options.typePrefix);

  return async (path: string): Promise<{ path: string } | undefined> => {
    const start = process.hrtime();
    const relPath = relative(options.root ?? '.', path);
    try {
      if (await cacheStore.isStale(path)) {
        const content = await readFile(path, 'utf-8');
        const output = await cacheStore.cachedOrProcessed(path, content, async (path, content) => {
          const file = parseFile(path, content);
          return file ? await typeScriptPrinter(loadFile(file)) : undefined;
        });
        if (output) {
          await mkdir(dirname(output.path), { recursive: true });
          await writeFile(output.path, output.content, 'utf-8');
          const elapsed = toMilliseconds(process.hrtime(start));
          ctx.logger.info(`[${output.isCached ? 'Cached' : 'Generated'}]: ${relPath} (${elapsed}ms)`);
        }
      } else {
        ctx.logger.info(`[Not modified]: ${relPath}`);
      }
      return { path };
    } catch (error) {
      const elapsed = toMilliseconds(process.hrtime(start));
      ctx.logger.error(`[Error]: ${relPath} (${elapsed})ms`);
      throw error;
    }
  };
};
