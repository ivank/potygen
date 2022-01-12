import { QueryInterface, TypeConstant, TypeUnionConstant } from '@potygen/query';
import { ClientBase } from 'pg';
import { SourceFile } from 'typescript';

export interface QualifiedName {
  schema: string;
  name: string;
}

export interface DataTable {
  type: 'Table';
  name: QualifiedName;
}
export interface DataFunction {
  type: 'Function';
  name: QualifiedName;
}
export interface DataEnum {
  type: 'Enum';
  name: QualifiedName;
}
export interface DataView {
  type: 'View';
  name: QualifiedName;
}
export interface DataComposite {
  type: 'Composite';
  name: QualifiedName;
}
export interface LoadedDataTable extends DataTable {
  data: Array<{ name: string; isNullable: string; record: string; type: string; comment?: string }>;
}
export interface LoadedDataComposite extends DataComposite {
  data: Array<{ name: string; isNullable: string; type: string }>;
}

export interface DataViewRaw extends DataView {
  data: string;
}
export interface DataViewParsed extends DataViewRaw {
  queryInterface: QueryInterface;
}
export interface LoadedDataView extends DataViewParsed {
  columns: LoadedResult[];
}
export interface LoadedDataFunction extends DataFunction {
  data: { returnType: string; isAggregate: boolean; argTypes: string[] };
}
export interface LoadedDataEnum extends DataEnum {
  data: string[];
}

export type Data = DataTable | DataFunction | DataEnum;
export type LoadedDataSimple = LoadedDataTable | LoadedDataFunction | LoadedDataEnum | LoadedDataComposite;
export type LoadedDataRaw = LoadedDataSimple | DataViewRaw;
export type LoadedData = LoadedDataSimple | LoadedDataView;

export interface LoadedParam {
  name: string;
  type: TypeConstant;
}
export interface LoadedResult {
  name: string;
  type: TypeConstant;
}

export interface LoadedQueryInterface {
  params: LoadedParam[];
  results: LoadedResult[];
}

export interface LoadedFunction {
  name: string;
  schema: string;
  returnType: TypeConstant;
  argTypes: TypeConstant[];
  isAggregate: boolean;
}
export interface LoadedComposite {
  name: string;
  schema?: string;
  attributes: Record<string, TypeConstant>;
}

export interface LoadedSourceTable {
  type: 'Table';
  isResult?: boolean;
  name: string;
  table: string;
  schema: string;
  items: Record<string, TypeConstant>;
}
export interface LoadedSourceQuery {
  type: 'Query';
  name: string;
  items: Record<string, TypeConstant>;
}
export interface LoadedSourceView {
  type: 'View';
  name: string;
  table: string;
  schema: string;
  items: Record<string, TypeConstant>;
}
export interface LoadedSourceValues {
  type: 'Values';
  name: string;
  items: Record<string, TypeConstant>;
}
export type LoadedSource = LoadedSourceTable | LoadedSourceQuery | LoadedSourceView | LoadedSourceValues;

export interface LoadedContext {
  sources: LoadedSource[];
  funcs: LoadedFunction[];
  enums: Record<string, TypeUnionConstant>;
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
  db: ClientBase;
  logger: Logger;
}
