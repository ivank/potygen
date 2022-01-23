import { TableTag, Tag } from './grammar.types';

export const enum TypeName {
  Buffer = 'Buffer',
  Any = 'Any',
  String = 'String',
  Number = 'Number',
  BigInt = 'BigInt',
  Boolean = 'Boolean',
  Date = 'Date',
  Null = 'Null',
  Json = 'Json',
  Unknown = 'Unknown',
  Composite = 'Composite',
  Array = 'Array',
  Union = 'Union',
  ObjectLiteral = 'ObjectLiteral',
  Optional = 'Optional',

  LoadCoalesce = 'LoadCoalesce',
  LoadColumnCast = 'LoadColumnCast',
  LoadRecord = 'LoadRecord',
  LoadFunction = 'LoadFunction',
  LoadColumn = 'LoadColumn',
  LoadStar = 'LoadStar',
  LoadFunctionArgument = 'LoadFunctionArgument',
  LoadOperator = 'LoadOperator',
  LoadNamed = 'LoadNamed',
  LoadArray = 'LoadArray',
  LoadAsArray = 'LoadAsArray',
  LoadArrayItem = 'LoadArrayItem',
  LoadCompositeAccess = 'LoadCompositeAccess',
  LoadUnion = 'LoadUnion',
  LoadObjectLiteral = 'LoadObjectLiteral',
  LoadOptional = 'LoadOptional',
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

/**
 * Types that can be loaded from the database.
 */
export interface BaseTypeLoaded {
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

export interface TypeString extends BaseTypeLoaded {
  type: TypeName.String;
  literal?: string;
}

export interface TypeBuffer extends BaseTypeLoaded {
  type: TypeName.Buffer;
}

export interface TypeNumber extends BaseTypeLoaded {
  type: TypeName.Number;
  literal?: number;
}

export interface TypeBigInt extends BaseTypeLoaded {
  type: TypeName.BigInt;
  literal?: number;
}

export interface TypeBoolean extends BaseTypeLoaded {
  type: TypeName.Boolean;
  literal?: boolean;
}

export interface TypeDate extends BaseTypeLoaded {
  type: TypeName.Date;
}

export interface TypeNull extends BaseTypeLoaded {
  type: TypeName.Null;
}

export interface TypeJson extends BaseTypeLoaded {
  type: TypeName.Json;
}
export interface TypeUnknown extends BaseTypeLoaded {
  type: TypeName.Unknown;
}
export interface TypeAny extends BaseTypeLoaded {
  type: TypeName.Any;
}
export interface TypeLoadCoalesce extends BaseTypeLoad {
  type: TypeName.LoadCoalesce;
  items: Type[];
  comment?: string;
}
export interface TypeLoadColumnCast extends BaseTypeLoad {
  type: TypeName.LoadColumnCast;
  column: Type;
  value: Type;
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
  args: Type[];
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
  args: Type[];
}

export interface TypeLoadOperator extends BaseTypeLoad {
  type: TypeName.LoadOperator;
  part: OperatorVariantPart;
  left: Type;
  right: Type;
  available: OperatorVariant[];
}
export interface TypeLoadNamed extends BaseTypeLoad {
  type: TypeName.LoadNamed;
  name: string;
  value: Type;
}
export interface TypeLoadArray extends BaseTypeLoad {
  type: TypeName.LoadArray;
  items: Type;
}
/**
 * Load the type and convert it to Array type if its not already an array
 * Functions like ARRAY_AGG will do that for the result.
 */
export interface TypeLoadAsArray extends BaseTypeLoad {
  type: TypeName.LoadAsArray;
  items: Type;
}
export interface TypeLoadArrayItem extends BaseTypeLoad {
  type: TypeName.LoadArrayItem;
  value: Type;
}
export interface TypeLoadCompositeAccess extends BaseTypeLoad {
  type: TypeName.LoadCompositeAccess;
  value: Type;
  name: string;
}
export interface TypeComposite extends BaseTypeLoaded {
  type: TypeName.Composite;
  name: string;
  schema?: string;
  attributes: Record<string, TypeConstant>;
}
export interface TypeLoadUnion extends BaseTypeLoad {
  type: TypeName.LoadUnion;
  items: Type[];
}
export interface TypeArray extends BaseTypeLoaded {
  type: TypeName.Array;
  items: TypeConstant;
}
export interface TypeUnion extends BaseTypeLoaded {
  type: TypeName.Union;
  items: TypeConstant[];
}
export interface TypeLoadObjectLiteral extends BaseTypeLoad {
  type: TypeName.LoadObjectLiteral;
  items: Array<{ name: string; type: Type }>;
  nullable?: boolean;
}
export interface TypeObjectLiteral extends BaseTypeLoaded {
  type: TypeName.ObjectLiteral;
  items: Array<{ name: string; type: TypeConstant }>;
}
export interface TypeLoadOptional extends BaseTypeLoad {
  type: TypeName.LoadOptional;
  nullable?: boolean;
  value: Type;
}
export interface TypeOptional extends BaseTypeLoaded {
  type: TypeName.Optional;
  value: TypeConstant;
}

export type TypeLiteral = TypeString | TypeNumber | TypeBigInt | TypeBoolean;

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

export type TypeConstant =
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

export type Type =
  | TypeLoadOptional
  | TypeConstant
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
export type OperatorVariant = [left: TypeConstant, right: TypeConstant, result: TypeConstant];

export interface Result {
  name: string;
  type: Type | TypeLoadStar;
}

export interface Param {
  name: string;
  type: Type;
  start: number;
  end: number;
  required: boolean;
  pick: Array<{ name: string; type: Type }>;
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
  type: Type;
  columns: TypeLoadColumn[];
  inComparationInclusion?: boolean;
  from?: TableTag;
}
