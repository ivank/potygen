import { QueryInterface, TypeConstant, TypeUnionConstant } from '@psql-ts/query';
import { SourceFile } from 'typescript';

export interface DataTable {
  type: 'Table';
  name: { schema: string; name: string };
}
export interface DataFunction {
  type: 'Function';
  name: string;
}
export interface DataEnum {
  type: 'Enum';
  name: string;
}
export interface LoadedDataColumn {
  name: string;
  isNullable: 'YES' | 'NO';
  enum: string;
  type: string;
}

export interface LoadedDataTable extends DataTable {
  columns: LoadedDataColumn[];
}

export interface LoadedDataFunction extends DataFunction {
  returnType: string;
  isAggregate: boolean;
  argTypes: string[];
}
export interface LoadedDataEnum extends DataEnum {
  enum: string[];
}

export type Data = DataTable | DataFunction | DataEnum;
export type LoadedData = LoadedDataTable | LoadedDataFunction | LoadedDataEnum;

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
  returnType: TypeConstant;
  argTypes: TypeConstant[];
  isAggregate: boolean;
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
export type LoadedSource = LoadedSourceTable | LoadedSourceQuery;

export interface LoadedContext {
  sources: LoadedSource[];
  funcs: LoadedFunction[];
  enums: Record<string, TypeUnionConstant>;
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
