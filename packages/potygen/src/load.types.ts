/**
 * load.types.ts
 *
 * The types for the "last stage" for converting from an SQL ast to what the actual typescript types are.
 * The actual implementation is in [load.ts](./load.ts)
 */

import { AstTag, Tag } from './grammar.types';
import { QueryInterface, Source, Type, TypeUnion } from './query-interface.types';
import { SourceFile } from 'typescript';
import { SqlDatabase } from './sql.types';

export interface QualifiedName {
  schema: string;
  name: string;
}

/**
 * A table that must be loaded from the database.
 * Resulsts in {@link LoadedDataTable}
 */
export interface DataTable {
  type: 'Table';
  name: QualifiedName;
}

/**
 * An sql function that must be loaded from the database.
 * Resulsts in {@link LoadedDataFunction}
 */
export interface DataFunction {
  type: 'Function';
  name: QualifiedName;
}

/**
 * A [postgres enum](https://www.postgresql.org/docs/current/datatype-enum.html) that must be loaded from the database.
 * Resulsts in {@link LoadedDataEnum}
 */
export interface DataEnum {
  type: 'Enum';
  name: QualifiedName;
}

/**
 * An [sql view](https://www.postgresql.org/docs/14/sql-createview.html) that must be loaded from the database.
 * Resulsts in {@link LoadedDataView}
 */
export interface DataView {
  type: 'View';
  name: QualifiedName;
}

/**
 * A [composite type](https://www.postgresql.org/docs/14/rowtypes.html) that must be loaded from the database.
 */
export interface DataComposite {
  type: 'Composite';
  name: QualifiedName;
}

/**
 * Postgres table with data on types and comments of all of its columns.
 */
export interface LoadedDataTable extends DataTable {
  comment?: string;
  data: Array<{ name: string; isNullable: string; record: string; type: string; comment?: string }>;
}

/**
 * A [composite type](https://www.postgresql.org/docs/14/rowtypes.html) with data on all of its parts.
 */
export interface LoadedDataComposite extends DataComposite {
  comment?: string;
  data: Array<{ name: string; isNullable: string; type: string }>;
}

/**
 * An intermediary [sql view](https://www.postgresql.org/docs/14/sql-createview.html) representation.
 * Contains the raw SQL of the view, to be parsed and loded
 */
export interface DataViewRaw extends DataView {
  comment?: string;
  data: string;
}

/**
 * An intermediary [sql view](https://www.postgresql.org/docs/14/sql-createview.html) representation.
 * Contains the raw SQL of the view, As well as the parsed {@link QueryInterface}
 */
export interface DataViewParsed extends DataViewRaw {
  queryInterface: QueryInterface;
}

/**
 * An loaded [sql view](https://www.postgresql.org/docs/14/sql-createview.html) representation.
 * Contains the raw SQL of the view, parsed {@link QueryInterface} as well as all the loaded column's data
 */
export interface LoadedDataView extends DataViewParsed {
  columns: LoadedResult[];
}

/**
 * An sql function with the loaded and argment types
 */
export interface LoadedDataFunction extends DataFunction {
  comment?: string;
  data: { returnType: string; isAggregate: boolean; argTypes: string[] };
}

/**
 * An enum with all of its variants loaded from the database schema
 */
export interface LoadedDataEnum extends DataEnum {
  comment?: string;
  data: string[];
}

/**
 * Data to be loaded from the database
 */
export type Data = DataTable | DataFunction | DataEnum;

/**
 * First pass on loded data, without views
 */
export type LoadedDataSimple = LoadedDataTable | LoadedDataFunction | LoadedDataEnum | LoadedDataComposite;
/**
 * First pass on loded data
 */
export type LoadedDataRaw = LoadedDataSimple | DataViewRaw;

/**
 * All the loded data, specified by {@link Data}
 */
export type LoadedData = LoadedDataSimple | LoadedDataView;

/**
 * A {@link Param} Where the type has been resolved to a static {@link Type}
 */
export interface LoadedParam {
  name: string;
  type: Type;
}

/**
 * A {@link Result} Where the type has been resolved to a static {@link Type}
 */
export interface LoadedResult {
  name: string;
  type: Type;
}

/**
 * {@link QueryInterface} where all the types have been resolved
 */
export interface LoadedQueryInterface {
  params: LoadedParam[];
  results: LoadedResult[];
}

/**
 * An sql function {@link LoadedDataFunction} Where all the types have been converted to {@link Type}
 */
export interface LoadedFunction {
  name: string;
  schema: string;
  returnType: Type;
  argTypes: Type[];
  isAggregate: boolean;
  comment?: string;
}

/**
 * An composite type {@link LoadedDataComposite} Where all the types have been converted to {@link Type}
 */
export interface LoadedComposite {
  name: string;
  schema?: string;
  attributes: Record<string, Type>;
}

/**
 * An sql table {@link LoadedDataTable} Where all the types have been converted to {@link Type}
 */
export interface LoadedSourceTable {
  type: 'Table';
  isResult?: boolean;
  name: string;
  table: string;
  schema: string;
  items: Record<string, Type>;
}

/**
 * An subquery Where all the types have been converted to {@link Type}
 */
export interface LoadedSourceQuery {
  type: 'Query';
  name: string;
  items: Record<string, Type>;
}

/**
 * An sql view {@link LoadedDataView} Where all the types have been converted to {@link Type}
 */
export interface LoadedSourceView {
  type: 'View';
  name: string;
  table: string;
  schema: string;
  items: Record<string, Type>;
}

/**
 * A source of VALUES objects
 */
export interface LoadedSourceValues {
  type: 'Values';
  name: string;
  items: Record<string, Type>;
}

/**
 * A source of recordset with column list
 */
export interface LoadedSourceRecordset {
  type: 'Recordset';
  isResult?: boolean;
  name: string;
  items: Record<string, Type>;
}

/**
 * A source that couldn't be found as subquery or in the database.
 * This would result in an error, but inspection pipeline needs it to be just a type.
 */
export interface LoadedSourceUnknown {
  type: 'Unknown';
  name: string;
  source: Source;
}

export type LoadedSource =
  | LoadedSourceTable
  | LoadedSourceQuery
  | LoadedSourceView
  | LoadedSourceValues
  | LoadedSourceRecordset;

export type LoadedSourceWithUnknown = LoadedSource | LoadedSourceUnknown;

export interface LoadedContext extends LoadedContextWithUnknown {
  sources: LoadedSource[];
}
export interface LoadedContextWithUnknown {
  sources: LoadedSourceWithUnknown[];
  funcs: LoadedFunction[];
  enums: Record<string, TypeUnion>;
  composites: LoadedComposite[];
}

export interface TemplateTagQuery {
  name: string;
  template: string;
  queryInterface: QueryInterface;
  pos: number;
}

export interface ParsedTypescriptFile {
  type: 'ts';
  path: string;
  source: SourceFile;
  queries: TemplateTagQuery[];
}

export interface ParsedSqlFile {
  type: 'sql';
  path: string;
  content: string;
  queryInterface: QueryInterface;
}

export type ParsedFile = ParsedSqlFile | ParsedTypescriptFile;

export interface LoadedTemplateTagQuery extends TemplateTagQuery {
  loadedQuery: LoadedQueryInterface;
}

export interface LoadedTypescriptFile extends ParsedTypescriptFile {
  queries: LoadedTemplateTagQuery[];
}

export interface LoadedSqlFile extends ParsedSqlFile {
  loadedQuery: LoadedQueryInterface;
}

export type LoadedFile = LoadedSqlFile | LoadedTypescriptFile;

/**
 * A logger interface that `console` can fulfull.
 * So we can use console by default but have an abstraction for testing
 */
export interface Logger {
  info(args: unknown): void;
  debug(args: unknown): void;
  error(args: unknown): void;
}

export interface LoadContext {
  db: SqlDatabase;
  logger: Logger;
}

export interface PathItem<T extends Tag> {
  index?: number;
  tag: T;
}
export type Path = PathItem<Tag>[];

export interface CompletionEntry {
  name: string;
  source?: string;
}

export interface QuickInfo {
  display: string;
  description: string;
  start: number;
  end: number;
}

export interface InspectError {
  message: string;
  code: number;
  start: number;
  end: number;
}

export interface InfoLoadedQuery {
  ast: AstTag;
  query: LoadedContext;
}

export interface Cache<TKey, TValue> {
  set(key: TKey, value: TValue): TValue;
  get(key: TKey): TValue | undefined;
}

export interface InfoContext {
  logger: Logger;
  data: LoadedData[];
  cache: Cache<string, InfoLoadedQuery>;
}
