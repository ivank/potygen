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
import { toEmitFile } from './emit';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { createHash } from 'crypto';

const cacheVersion = '1.0';

export class CacheStore {
  public contents = new Map<string, { path: string; content: string } | undefined>();
  public updates = new Map<string, number>();

  constructor(public fileName: string, public enabled: boolean = false, public cacheClear: boolean = false) {}

  public async isStale(path: string): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }
    const mtime = (await stat(path)).mtime.getTime();
    const currentMtime = this.updates.get(path);
    return !(currentMtime && mtime === currentMtime);
  }

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
    if (cached) {
      return { ...cached, isCached: true };
    } else {
      const processed = await process(path, content);
      const mtime = (await stat(path)).mtime.getTime();
      this.contents.set(key, processed);
      this.updates.set(path, mtime);
      return processed;
    }
  }

  public async load(): Promise<void> {
    if (!this.cacheClear && existsSync(this.fileName)) {
      const cache = JSON.parse(await readFile(this.fileName, 'utf-8'));
      if (typeof cache === 'object' && cache !== null && 'version' in cache && cache.version === cacheVersion) {
        this.updates = new Map(Object.entries(cache.updates));
        this.contents = new Map(Object.entries(cache.contents));
      }
    }
  }

  public async save() {
    await mkdir(dirname(this.fileName), { recursive: true });
    await writeFile(
      this.fileName,
      JSON.stringify({
        updates: Object.fromEntries(this.updates),
        contents: Object.fromEntries(this.contents),
        version: cacheVersion,
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
        throw new ParseError(tag, `Error parsing sql: ${error instanceof Error ? error.message : String(error)}`);
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

export const toProcess = async (
  ctx: LoadContext,
  cacheStore: CacheStore,
  options: { root: string; template: string; typePrefix?: string },
) => {
  const data = await loadAllData(ctx, []);
  const loadFile = toLoadFile(data);
  const emit = toEmitFile(options.root, options.template, options.typePrefix);

  return async (path: string) => {
    const start = process.hrtime();
    try {
      if (await cacheStore.isStale(path)) {
        const content = await readFile(path, 'utf-8');
        const output = await cacheStore.cachedOrProcessed(path, content, async (path, content) => {
          const file = parseFile(path, content);
          return file ? await emit(loadFile(file)) : undefined;
        });
        if (output) {
          await writeFile(output.path, output.content, 'utf-8');
          const elapsed = toMilliseconds(process.hrtime(start));
          ctx.logger.info(
            `[${relative(options.root ?? '.', path)}]: ${output.isCached ? 'Cached' : 'Generated'} (${elapsed}ms)`,
          );
        }
      } else {
        ctx.logger.info(`[${relative(options.root ?? '.', path)}]: Not modified`);
      }
    } catch (error) {
      const elapsed = toMilliseconds(process.hrtime(start));
      ctx.logger.error(`[${relative(options.root ?? '.', path)}]: Error (${elapsed})ms`);
      throw error;
    }
  };
};
