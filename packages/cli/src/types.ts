import { ColumnType, FunctionArgType, FunctionType, QueryInterface, RecordType, StarType } from '@psql-ts/query';
import { SourceFile } from 'typescript';

export type LoadedUnion = { type: 'union'; items: LoadedType[]; optional?: boolean };
export type LoadedArray = { type: 'array'; items: LoadedType; optional?: boolean };
export type LoadedLiteral = { type: 'literal'; value: string; optional?: boolean };
export type LoadedConstant = {
  type: 'string' | 'number' | 'boolean' | 'Date' | 'null' | 'json' | 'unknown';
  optional?: boolean;
};
export type LoadedValuesPick = { type: 'pick'; items: Array<{ name: string; value: LoadedType }>; optional?: boolean };
export type LoadedType = LoadedUnion | LoadedArray | LoadedLiteral | LoadedConstant;

export interface LoadedResult {
  name: string;
  type: LoadedType;
}

export interface LoadedParam {
  name: string;
  type: LoadedType | LoadedValuesPick;
}

export interface LoadedQuery {
  params: LoadedParam[];
  result: LoadedResult[];
}

export interface LoadContext {
  columnTypes: ColumnType[];
  starTypes: StarType[];
  functionTypes: (FunctionType | FunctionArgType)[];
  recordTypes: RecordType[];
}

export interface Info {
  schema: string;
  table: string;
  column: string;
  isNullable: 'YES' | 'NO';
  recordName: string;
  dataType: string;
}

export interface Function {
  schema: string;
  name: string;
  dataType: string;
  isAggregate: boolean;
  parametersDataType: string[];
}

export interface Record {
  name: string;
  enum: string[];
}

export interface DataContext {
  info: Info[];
  functions: Function[];
  records: Record[];
}

export interface Context {
  data: DataContext;
  load: LoadContext;
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
  loadedQuery: LoadedQuery;
}

export interface LoadedTypescriptFile extends ParsedTypescriptFile {
  queries: LoadedTemplateTagQuery[];
}

export interface LoadedSqlFile extends ParsedSqlFile {
  loadedQuery: LoadedQuery;
}

export type LoadedFile = LoadedSqlFile | LoadedTypescriptFile;
