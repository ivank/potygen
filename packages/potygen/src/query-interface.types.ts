import { TableTag, Tag } from './grammar.types';

export const enum TypeName {
  Buffer,
  Any,
  String,
  Number,
  BigInt,
  Boolean,
  Date,
  Null,
  Json,
  Unknown,
  Composite,
  Array,
  Union,
  ObjectLiteral,
  Optional,
  LoadCoalesce,
  LoadColumnCast,
  LoadRecord,
  LoadFunction,
  LoadColumn,
  LoadStar,
  LoadFunctionArgument,
  LoadOperator,
  LoadNamed,
  LoadArray,
  LoadAsArray,
  LoadArrayItem,
  LoadCompositeAccess,
  LoadUnion,
  LoadObjectLiteral,
  LoadOptional,
}

/**
 * Types that can be loaded from the database.
 */
export interface BaseType {
  type: TypeName;
  /**
   * Comment originating from postgres
   * https://www.postgresql.org/docs/current/sql-comment.html
   */
  comment?: string;
  /**
   * A string representing raw postgres type as string, loaded from the database
   */
  postgresType: string;
  /**
   * If the type originated from a column / field in the database that could be null.
   */
  nullable?: boolean;
}

export interface TypeString extends BaseType {
  type: TypeName.String;
  literal?: string;
}

export interface TypeBuffer extends BaseType {
  type: TypeName.Buffer;
}

export interface TypeNumber extends BaseType {
  type: TypeName.Number;
  literal?: number;
}

export interface TypeBigInt extends BaseType {
  type: TypeName.BigInt;
  literal?: number;
}

export interface TypeBoolean extends BaseType {
  type: TypeName.Boolean;
  literal?: boolean;
}

export interface TypeDate extends BaseType {
  type: TypeName.Date;
}

export interface TypeNull extends BaseType {
  type: TypeName.Null;
}

export interface TypeJson extends BaseType {
  type: TypeName.Json;
}

export interface TypeUnknown extends BaseType {
  type: TypeName.Unknown;
}

export interface TypeAny extends BaseType {
  type: TypeName.Any;
}

/**
 * Types that need to pass "Load" step.
 */
export interface BaseTypeLoad {
  type: TypeName;
  /**
   * The original sql tag that was used to load the type
   */
  sourceTag: Tag;
}

export interface TypeLoadCoalesce extends BaseTypeLoad {
  type: TypeName.LoadCoalesce;
  items: TypeOrLoad[];
  comment?: string;
}
export interface TypeLoadColumnCast extends BaseTypeLoad {
  type: TypeName.LoadColumnCast;
  column: TypeOrLoad;
  value: TypeOrLoad;
}
export interface TypeLoadRecord extends BaseTypeLoad {
  type: TypeName.LoadRecord;
  name: string;
  schema?: string;
}
export interface TypeLoadFunction extends BaseTypeLoad {
  type: TypeName.LoadFunction;
  name: string;
  schema?: string;
  args: TypeOrLoad[];
}
export interface TypeLoadColumn extends BaseTypeLoad {
  type: TypeName.LoadColumn;
  column: string;
  table?: string;
  schema?: string;
}

export interface TypeLoadStar extends BaseTypeLoad {
  type: TypeName.LoadStar;
  table?: string;
  schema?: string;
}
export interface TypeLoadFunctionArgument extends BaseTypeLoad {
  type: TypeName.LoadFunctionArgument;
  index: number;
  name: string;
  schema?: string;
  args: TypeOrLoad[];
}

export interface TypeLoadOperator extends BaseTypeLoad {
  type: TypeName.LoadOperator;
  part: OperatorVariantPart;
  left: TypeOrLoad;
  right: TypeOrLoad;
  available: OperatorVariant[];
}
export interface TypeLoadNamed extends BaseTypeLoad {
  type: TypeName.LoadNamed;
  name: string;
  value: TypeOrLoad;
}
export interface TypeLoadArray extends BaseTypeLoad {
  type: TypeName.LoadArray;
  items: TypeOrLoad;
}
/**
 * Load the type and convert it to Array type if its not already an array
 * Functions like ARRAY_AGG will do that for the result.
 */
export interface TypeLoadAsArray extends BaseTypeLoad {
  type: TypeName.LoadAsArray;
  items: TypeOrLoad;
}
export interface TypeLoadArrayItem extends BaseTypeLoad {
  type: TypeName.LoadArrayItem;
  value: TypeOrLoad;
}
export interface TypeLoadCompositeAccess extends BaseTypeLoad {
  type: TypeName.LoadCompositeAccess;
  value: TypeOrLoad;
  name: string;
}
export interface TypeComposite extends BaseType {
  type: TypeName.Composite;
  name: string;
  schema?: string;
  attributes: Record<string, Type>;
}
export interface TypeLoadUnion extends BaseTypeLoad {
  type: TypeName.LoadUnion;
  items: TypeOrLoad[];
}
export interface TypeArray extends BaseType {
  type: TypeName.Array;
  items: Type;
}
export interface TypeUnion extends BaseType {
  type: TypeName.Union;
  items: Type[];
}
export interface TypeLoadObjectLiteral extends BaseTypeLoad {
  type: TypeName.LoadObjectLiteral;
  items: Array<{ name: string; type: TypeOrLoad }>;
  nullable?: boolean;
}
export interface TypeObjectLiteral extends BaseType {
  type: TypeName.ObjectLiteral;
  items: Array<{ name: string; type: Type }>;
}
export interface TypeLoadOptional extends BaseTypeLoad {
  type: TypeName.LoadOptional;
  nullable?: boolean;
  value: TypeOrLoad;
}
export interface TypeOptional extends BaseType {
  type: TypeName.Optional;
  value: Type;
}

export type TypeLiteral = TypeString | TypeNumber | TypeBigInt | TypeBoolean;

export type TypeLoad =
  | TypeLoadOptional
  | TypeLoadColumn
  | TypeLoadFunction
  | TypeLoadFunctionArgument
  | TypeLoadRecord
  | TypeLoadStar
  | TypeLoadOperator
  | TypeLoadNamed
  | TypeLoadCoalesce
  | TypeLoadArray
  | TypeLoadAsArray
  | TypeLoadArrayItem
  | TypeLoadCompositeAccess
  | TypeLoadUnion
  | TypeLoadColumnCast
  | TypeLoadObjectLiteral;

export type TypeNullable =
  | TypeBuffer
  | TypeString
  | TypeNumber
  | TypeBigInt
  | TypeBoolean
  | TypeDate
  | TypeJson
  | TypeArray
  | TypeUnion
  | TypeLoadOptional;

export type Type =
  | TypeBuffer
  | TypeAny
  | TypeString
  | TypeNumber
  | TypeBigInt
  | TypeBoolean
  | TypeDate
  | TypeNull
  | TypeJson
  | TypeUnknown
  | TypeComposite
  | TypeArray
  | TypeUnion
  | TypeObjectLiteral
  | TypeOptional;

export type TypeOrLoad = Type | TypeLoad;

/**
 * Which part of the operator variant to use in {@link OperatorVariant}
 * ```
 * Left(0)─┐     ┌─Right(1)
 *         ▼     ▼
 *        113 + 423
 *       └─────────┘
 *            └▶Result(2)
 * ```
 */
export const enum OperatorVariantPart {
  Left = 0,
  Right = 1,
  Result = 2,
}

/**
 * Tuple describing a variant of a binary operator expression.
 * Exmaples of variants of "+":
 *
 * ```sql
 * SELECT count + 321
 * ```
 * (number) + (number) -> (string)
 *
 * ```sql
 * SELECT created_at + '1 DAY'
 * ```
 * (date) + (string) -> (date)
 *
 * ```
 * Left(0)─┐     ┌─Right(1)
 *         ▼     ▼
 *        113 + 423
 *       └─────────┘
 *            └▶Result(2)
 * ```
 */
export type OperatorVariant = [left: Type, right: Type, result: Type];

export interface Result {
  name: string;
  type: TypeOrLoad | TypeLoadStar;
}

export interface Param {
  name: string;
  type: TypeOrLoad;
  start: number;
  end: number;
  required: boolean;
  pick: Array<{ name: string; type: TypeOrLoad }>;
  spread: boolean;
}

export type Source = SourceTable | SourceQuery | SourceValues;

export interface SourceTable {
  type: 'Table';
  sourceTag: Tag;
  isResult?: boolean;
  schema?: string;
  table: string;
  name: string;
}

export interface SourceValues {
  type: 'Values';
  sourceTag: Tag;
  types?: TypeLoadNamed[];
  name: string;
}

export interface SourceQuery {
  type: 'Query';
  sourceTag: Tag;
  name: string;
  value: QueryInterface;
}

/**
 * The "intput and output" of a query.
 */
export interface QueryInterface {
  /**
   * Input of the query. All the parameters
   */
  params: Param[];
  /**
   * All the columns this query will return
   */
  results: Result[];
  /**
   * The data sources that would be needed to fullfill the request.
   */
  sources: Source[];
}

export interface TypeContext {
  type: TypeOrLoad;
  columns: TypeLoadColumn[];
  inComparationInclusion?: boolean;
  from?: TableTag;
}
