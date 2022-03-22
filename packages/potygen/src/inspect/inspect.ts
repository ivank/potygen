/**
 * inspect.ts
 *
 * Introspect details about a given sql string and position.
 * Used by autocomplete / quickinfo code.
 */

import { parser, partialParser } from '../grammar';
import { first, groupBy, isUnique } from '../util';
import { toQueryInterface } from '../query-interface';
import { markTextError, ParserError } from '@ikerin/rd-parse';
import { toPath } from './path';
import { LRUCache } from './cache';
import {
  LoadedData,
  Logger,
  Path,
  LoadedContext,
  CompletionEntry,
  InfoContext,
  InfoLoadedQuery,
  QuickInfo,
  InspectError,
  LoadedSource,
} from '../load.types';
import { toLoadedContext, filterUnknownLoadedContext, throwOnUnknownLoadedContext } from '../load';
import {
  isLoadedDataTable,
  isLoadedDataComposite,
  isLoadedDataEnum,
  isLoadedDataView,
  isLoadedSourceTable,
  isLoadedSourceView,
} from '../load.guards';
import { inspect } from 'util';
import { quickInfoColumn, quickInfoEnum, quickInfoSource, quickInfoTable, quickInfoView } from './formatters';
import { LoadError } from '../errors';
import { AstTag } from '../grammar.types';
import { Info, pathToInfo } from './info';

/**
 * A point of interest ({@link Info}) alongiside its context - AST, path and the query context
 */
interface LoadedInfo {
  info: Info;
  ast: AstTag;
  path: Path;
  query: LoadedContext;
}

/**
 * Some common types to return in completions of types, alongside user defined ones.
 */
const commonTypes = ['bool', 'char', 'varchar', 'int', 'decimal', 'float', 'serial', 'date', 'timestamp', 'time'];

const toInfoLoadedContext = (data: LoadedData[], sql: string): InfoLoadedQuery => {
  const { ast } = partialParser(sql);
  const { sources } = toQueryInterface(ast);
  return { ast, query: filterUnknownLoadedContext(toLoadedContext({ data, sources })) };
};

/**
 * Get the {@link LoadedInfo} at a certain position
 */
const toLoadedInfo = (ctx: InfoContext, sql: string, offset: number): LoadedInfo | undefined => {
  const { ast, query } = ctx.cache.get(sql) ?? ctx.cache.set(sql, toInfoLoadedContext(ctx.data, sql));

  if (!ast) {
    return undefined;
  }

  const path = toPath(ast, offset);

  if (!path) {
    return undefined;
  }
  const info = pathToInfo(path);

  if (!info) {
    return undefined;
  }
  return { ast, path, info, query };
};

/**
 * Initialize the {@link InfoContext} with a cache
 */
export const toInfoContext = (data: LoadedData[], logger: Logger): InfoContext => ({
  data,
  logger,
  cache: new LRUCache<string, InfoLoadedQuery>(),
});

/**
 * Find the {@link LoadedData} of a certain type and a name
 */
const toNamedData = <T extends LoadedData>(
  ctx: InfoContext,
  predicate: (item: LoadedData) => item is T,
  { name, schema }: { name?: string; schema?: string },
) =>
  ctx.data
    .filter(predicate)
    .filter((table) => table.name.schema === (schema ?? 'public') && table.name.name === (name ?? table.name.name));

/**
 * Find the {@link LoadedSource} of a certain name
 */
const toNamedSource = (query: LoadedContext, name: { source?: string; name: string }): LoadedSource | undefined =>
  name.source
    ? query.sources.find((source) => source.name === name.source)
    : query.sources.find((source) => name.name in source.items);

const removeAmbiguousColumns = (items: Array<CompletionEntry>): Array<CompletionEntry> =>
  Object.entries(groupBy(({ name }) => name, items))
    .filter(([_, items]) => items.length === 1)
    .map(([_, items]) => items[0]);

export const completionAtOffset = (ctx: InfoContext, sql: string, offset: number): CompletionEntry[] | undefined => {
  const loadedInfo = toLoadedInfo(ctx, sql, offset);

  if (!loadedInfo) {
    return undefined;
  }
  const { info, query } = loadedInfo;

  ctx.logger.debug(
    `Completion Info found in: \n${markTextError(sql, `${info.type}: ${info.start}...${info.end}`, offset)}`,
  );

  switch (info.type) {
    case 'EnumVariant':
      const column = toNamedSource(query, info.column)?.items[info.column.name];
      const dataEnum = first(
        toNamedData(ctx, isLoadedDataEnum, { schema: info.column.schema, name: column?.postgresType }),
      );
      return dataEnum?.data.filter(isUnique()).map((name) => ({ name }));
    case 'Column':
      return info.source
        ? Object.entries(query.sources.find((source) => source.name === info.source)?.items ?? {}).map(
            ([name, type]) => ({ name, source: type.comment }),
          )
        : [
            ...removeAmbiguousColumns(
              query.sources
                .flatMap((source) => Object.entries(source.items))
                .map(([name, type]) => ({ name, source: type.comment })),
            ),
            ...query.sources.map(({ name }) => ({ name: name, source: 'Table' })),
          ];
    case 'Source':
      return query.sources
        .map((source) => ({ name: source.name }))
        .concat(
          query.sources
            .flatMap((source) => Object.entries(source.items))
            .map(([name, type]) => ({ name, source: type.comment })),
        );
    case 'Table':
      return toNamedData(ctx, isLoadedDataTable, { schema: info.schema }).map((table) => ({
        name: table.name.name,
        source: table.comment,
      }));
    case 'Cast':
      const userDefinedTypes = [...ctx.data.filter(isLoadedDataEnum), ...ctx.data.filter(isLoadedDataComposite)];
      return [
        ...userDefinedTypes.map((item) => ({ name: item.name.name, source: item.comment })),
        ...commonTypes.map((name) => ({ name, source: 'Native' })),
      ];
    case 'Schema':
      return [];
  }
};

export const inspectError = (ctx: InfoContext, sql: string): InspectError | undefined => {
  try {
    const { ast } = parser(sql);
    const { sources } = toQueryInterface(ast);
    throwOnUnknownLoadedContext(toLoadedContext({ data: ctx.data, sources }));
  } catch (error) {
    if (error instanceof ParserError) {
      return {
        message: error.message,
        code: 1,
        start: error.parseStack.lastSeen.pos,
        end: error.parseStack.lastSeen.pos + 2,
      };
    } else if (error instanceof LoadError) {
      return { message: error.message, code: 2, start: error.tag.start, end: error.tag.end };
    }
  }
  return undefined;
};

export const quickInfoAtOffset = (ctx: InfoContext, sql: string, offset: number): QuickInfo | undefined => {
  const loadedInfo = toLoadedInfo(ctx, sql, offset);

  if (!loadedInfo) {
    return undefined;
  }
  const { info, query } = loadedInfo;

  ctx.logger.debug(`Quick Info found: ${inspect(info)}:`);

  switch (info.type) {
    case 'Column':
      const columnSource = toNamedSource(query, info);
      const column = columnSource?.items[info.name];

      const additionalEnum = first(
        toNamedData(ctx, isLoadedDataEnum, { schema: info.schema, name: column?.postgresType }),
      );
      const additionalComposite = first(
        toNamedData(ctx, isLoadedDataComposite, { schema: info.schema, name: column?.postgresType }),
      );

      ctx.logger.debug(`Quick Info Column: ${inspect({ column, additionalEnum, additionalComposite })}:`);

      return columnSource && column
        ? {
            ...quickInfoColumn(columnSource, info.name, column, additionalEnum ?? additionalComposite),
            start: info.start,
            end: info.end,
          }
        : undefined;

    case 'Source':
      const source = query.sources.find((item) => item.name === info.name);
      ctx.logger.debug(`Quick Info Source: ${inspect(source)}:`);
      return source ? { ...quickInfoSource(source), start: info.start, end: info.end } : undefined;

    case 'EnumVariant':
      const columnEnumType = toNamedSource(query, info.column)?.items[info.column.name];
      const dataEnum = first(
        toNamedData(ctx, isLoadedDataEnum, { schema: info.column.schema, name: columnEnumType?.postgresType }),
      );
      return dataEnum ? { ...quickInfoEnum(dataEnum), start: info.start, end: info.end } : undefined;

    case 'Table':
      const viewSource = query.sources.filter(isLoadedSourceView).find((item) => item.table === info.name);
      if (viewSource) {
        const dataView = first(toNamedData(ctx, isLoadedDataView, info));
        ctx.logger.debug(`Quick Info View: ${inspect(viewSource)}:`);
        return dataView ? { ...quickInfoView(viewSource, dataView), start: info.start, end: info.end } : undefined;
      }
      const tableSource = query.sources.filter(isLoadedSourceTable).find((item) => item.table === info.name);
      if (tableSource) {
        const dataTable = first(toNamedData(ctx, isLoadedDataTable, info));
        ctx.logger.debug(`Quick Info Table: ${inspect(tableSource)}:`);
        return dataTable ? { ...quickInfoTable(tableSource, dataTable), start: info.start, end: info.end } : undefined;
      }
    case 'Cast':
      const castType = first(toNamedData(ctx, isLoadedDataEnum, info));
      return castType ? { ...quickInfoEnum(castType), start: info.start, end: info.end } : undefined;
    case 'Schema':
      return undefined;
  }
};
