export const enum SqlName {
  Root,
  Comment,
  CTEName,
  CTEValuesList,
  CTEValues,
  CTE,
  With,
  Null,
  UnquotedIdentifier,
  QuotedIdentifier,
  Parameter,
  Column,
  As,
  String,
  DollarQuotedString,
  CustomQuotedString,
  BitString,
  HexademicalString,
  EscapeString,
  Number,
  Integer,
  Boolean,
  ConstantType,
  TypedConstant,
  ExtractField,
  Extract,
  ArrayIndexRange,
  ArrayColumnIndex,
  ArrayIndex,
  CompositeAccess,
  Count,
  Dimension,
  Type,
  ArrayType,
  Distinct,
  Filter,
  Star,
  StarIdentifier,
  Row,
  RowKeyward,
  When,
  Else,
  CaseSimple,
  Case,
  BinaryOperator,
  UnaryOperator,
  BinaryExpression,
  UnaryExpression,
  TernaryOperator,
  TernarySeparator,
  TernaryExpression,
  Cast,
  PgCast,
  ArrayConstructor,
  Function,
  ComparationArrayInclusionType,
  ComparationArrayOperator,
  ComparationArrayType,
  ComparationArrayInclusion,
  ComparationArray,
  Exists,
  SelectListItem,
  SelectList,
  NamedSelect,
  JoinType,
  JoinOn,
  JoinUsing,
  Join,
  FromList,
  From,
  Where,
  GroupBy,
  Having,
  CombinationType,
  Combination,
  OrderDirection,
  OrderByItem,
  OrderBy,
  Limit,
  LimitAll,
  Offset,
  Select,
  Default,
  SetItem,
  SetList,
  Columns,
  Values,
  SetMap,
  Set,
  QualifiedIdentifier,
  Table,
  UpdateFrom,
  ReturningListItem,
  Returning,
  Update,
  Using,
  Delete,
  ValuesList,
  Collate,
  ConflictTargetIndex,
  ConflictTarget,
  ConflictConstraint,
  DoNothing,
  DoUpdate,
  Conflict,
  Insert,
  WrappedExpression,
  TableWithJoin,
  ExpressionList,
  Begin,
  Commit,
  Savepoint,
  Rollback,
}

/**
 * Base Sql tag, holding state of the tag poistion in the text
 */
export interface SqlTag {
  start: number;
  end: number;
  tag: SqlName;
}

/**
 * Tags like "BEGIN", "NULL" or "DEFAULT" that don't have any data on them
 */
export interface EmptyLeafSqlTag extends SqlTag {}

/**
 * Tags that hold data and no children
 */
export interface LeafSqlTag extends SqlTag {
  value: string;
}

/**
 * Tags that conly contain leaf tags or other nodes
 */
export interface NodeSqlTag extends SqlTag {
  values: Tag[];
}

/**
 * A comment (`-- my comment`) sql tag. Sits outside of the AST.
 */
export interface CommentTag extends LeafSqlTag {
  tag: SqlName.Comment;
}

/**
 * The name of a common table expression (CTE), with optional column names
 * https://www.postgresql.org/docs/current/queries-with.html
 * ```
 *    name─┐
 *         ▼
 *     ┌ ─ ─ ─┌ ┬──────────┬ ┐
 * WITH table1│(│col1, col2│) VALUES (1, 2) INSERT INTO table2 SELECT * FROM table1
 *     └ ─ ─ ─┴ ┴──────────┴ ┘
 *             └──────────────┘
 *                  └─▶ColumnsTag
 * ```
 */
export interface CTENameTag extends NodeSqlTag {
  tag: SqlName.CTEName;
  values: [name: IdentifierTag] | [name: IdentifierTag, columns: ColumnsTag];
}

/**
 * Values list for common table expression (CTE), with optional column names
 * https://www.postgresql.org/docs/current/queries-with.html
 * ```
 *                              values─┐
 *                                     ▼
 *                           ┌ ─ ─ ─┬──────┐
 * WITH table1│(│col1, col2│) VALUES│(1, 2)│INSERT INTO table2 SELECT * FROM table1
 *                           └ ─ ─ ─┴──────┘
 *                          └───────────────┘
 *                                └─▶CTEValuesListTag
 * ```
 */
export interface CTEValuesListTag extends NodeSqlTag {
  tag: SqlName.CTEValuesList;
  values: (ParameterTag | CTEValuesTag)[];
}

/**
 * Values for common table expression (CTE), with optional column names
 * https://www.postgresql.org/docs/current/queries-with.html
 * ```
 *                              value─┐
 *                                     ▼
 *                                  ┌ ┬──┬ ┬──┬ ┐
 * WITH table1│(│col1, col2│) VALUES (│12│,│32│) INSERT INTO table2 SELECT * FROM table1
 *                                  └ ┴──┴ ┴──┴ ┘
 *                                 └─────────────┘
 *                                       └─▶CTEValuesTag
 * ```
 */
export interface CTEValuesTag extends NodeSqlTag {
  tag: SqlName.CTEValues;
  values: ExpressionTag[];
}

/**
 * Common Table Expression
 * Representing one of the additional queries of a With Expression
 * https://www.postgresql.org/docs/current/queries-with.html
 * ```
 *       ┌─── name
 *       ▼                                          ─┐
 * ┌ ─ ─┌─┬ ─               ┌─── query               │
 *  WITH│t│AS│              ▼                        │
 * └ ┬ ┬┴─┴─────────────────────────────────────┬ ┐  │──▶  CTE
 *    (│UPDATE products SET price = price * 1.05│)   │
 *   └ ┴────────────────────────────────────────┴ ┘  │
 *                                                  ─┘
 *  SELECT * FROM t;
 * ```
 */
export interface CTETag extends NodeSqlTag {
  tag: SqlName.CTE;
  values: [name: CTENameTag, query: QueryTag | CTEValuesListTag];
}

/**
 * With Expression
 * https://www.postgresql.org/docs/current/queries-with.html
 * ```
 *                       ┌───── cte
 *                       │                          ─┐
 *                       ▼                           │
 * ┌───────────────────────────────────────────┐     │
 * │WITH t AS (                                │     │
 * │  UPDATE products SET price = price * 1.05 │     │──▶ With
 * │)                                          │     │
 * ├────────────────┬──────────────────────────┘     │
 * │SELECT * FROM t;│◀──────── query                 │
 * └────────────────┘                               ─┘
 * ```
 */
export interface WithTag extends NodeSqlTag {
  tag: SqlName.With;
  values: [...cte: CTETag[], query: QueryTag];
}

/**
 * Representing the token "NULL"
 */
export interface NullTag extends EmptyLeafSqlTag {
  tag: SqlName.Null;
}

/**
 * An identifier token, naming various things - columns, tables, collations etc.
 * https://www.postgresql.org/docs/current/sql-syntax-lexical.html
 */
export interface UnquotedIdentifierTag extends LeafSqlTag {
  tag: SqlName.UnquotedIdentifier;
  value: string;
}

/**
 * Quoted identifier token (with double quotes), naming various things - columns, tables, collations etc.
 * https://www.postgresql.org/docs/current/sql-syntax-lexical.html
 */
export interface QuotedIdentifierTag extends LeafSqlTag {
  tag: SqlName.QuotedIdentifier;
  value: string;
}

/**
 * Parameter Tag
 *
 * Single:       $my_parameter
 * Colon Single: :my_parameter
 * Spread:       $$my_parameter
 * Single Pick:  $my_parameter(val1, val2)
 * Spread Pick   $$my_values(val1, val2)
 */
export interface ParameterTag extends LeafSqlTag {
  tag: SqlName.Parameter;
  type: 'spread' | 'single';
  value: string;
  required: boolean;
  pick: UnquotedIdentifierTag[];
}

/**
 * Column Tag, representing qualified or unqulified names
 * https://www.postgresql.org/docs/current/sql-expressions.html#FIELD-SELECTION
 * ```
 *            ┌─schema ┌─table   ┌─ name
 *            ▼        ▼         ▼
 *        ┌──────┬ ┬──────┬ ┬─────────┐
 * SELECT │public│.│table1│.│my_column│ FROM table1
 *        └──────┴ ┴──────┴ ┴─────────┘
 *       └─────────────────────────────┘
 *                      └─▶ColumnTag
 * ```
 */
export interface ColumnTag extends NodeSqlTag {
  tag: SqlName.Column;
  values:
    | [schema: IdentifierTag, table: IdentifierTag, name: IdentifierTag]
    | [table: IdentifierTag, name: IdentifierTag]
    | [name: IdentifierTag];
}

/**
 * "As" tag desginating an alias for tables or columns
 * ```
 *                        ┌──── name
 *                        ▼
 *                   ┌ ─┌───┐
 * SELECT  my_column  AS│"m"│ FROM table1
 *                   └ ─└───┘
 *                  └────────┘
 *                       └─▶AsTag
 * ```
 */
export interface AsTag extends NodeSqlTag {
  tag: SqlName.As;
  values: [IdentifierTag];
}

/**
 * A string tag, quoted in single quote, e.g. 'my value'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface StringTag extends LeafSqlTag {
  tag: SqlName.String;
  value: string;
}

/**
 * A dollar string tag, - a string quoted by $$, e.g. $$my weird value$$
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface DollarQuotedStringTag extends LeafSqlTag {
  tag: SqlName.DollarQuotedString;
  value: string;
}

/**
 * A custom quoted string tag, - a string quoted by $$, e.g. $TAG$my more weird value$TAG$
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface CustomQuotedStringTag extends LeafSqlTag {
  tag: SqlName.CustomQuotedString;
  delimiter: string;
  value: string;
}

/**
 * A string representing a binary value, prefixed with a B', e.g. B'1101'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface BitStringTag extends LeafSqlTag {
  tag: SqlName.BitString;
  value: string;
}

/**
 * A string representing a hexademical value, prefixed with a X', e.g. X'AF21'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface HexademicalStringTag extends LeafSqlTag {
  tag: SqlName.HexademicalString;
  value: string;
}

/**
 * An "escape" string constant for a C-Style Escape. prefixed by E', e.g. E'\o\o'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface EscapeStringTag extends LeafSqlTag {
  tag: SqlName.EscapeString;
  value: string;
}

/**
 * A tag for a number constant in various notations:
 *
 * 42
 * 3.5
 * 4.
 * .001
 * 5e2
 * 1.925e-3
 *
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface NumberTag extends LeafSqlTag {
  tag: SqlName.Number;
  value: string;
}

/**
 * A tag representing an integer number, e.g. 12
 */
export interface IntegerTag extends LeafSqlTag {
  tag: SqlName.Integer;
  value: string;
}

/**
 * A tag representing a boolean constant, e.g. TRUE
 */
export interface BooleanTag extends LeafSqlTag {
  tag: SqlName.Boolean;
  value: 'TRUE' | 'FALSE';
}

/**
 * A tag represinting the type of typed constant
 *
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface ConstantTypeTag extends LeafSqlTag {
  tag: SqlName.ConstantType;
  value:
    | 'XML'
    | 'XID'
    | 'VOID'
    | 'VARCHAR'
    | 'VARBIT'
    | 'UUID'
    | 'UNKNOWN'
    | 'TXID_SNAPSHOT'
    | 'TSVECTOR'
    | 'TSTZRANGE'
    | 'TSRANGE'
    | 'TSM_HANDLER'
    | 'TRIGGER'
    | 'TINTERVAL'
    | 'TIMETZ'
    | 'TIMESTAMPTZ'
    | 'TIMESTAMP'
    | 'TIME'
    | 'TID'
    | 'TEXT'
    | 'SMGR'
    | 'RELTIME'
    | 'REGTYPE'
    | 'REGROLE'
    | 'REGPROCEDURE'
    | 'REGPROC'
    | 'REGOPERATOR'
    | 'REGOPER'
    | 'REGNAMESPACE'
    | 'REGDICTIONARY'
    | 'REGCONFIG'
    | 'REGCLASS'
    | 'REFCURSOR'
    | 'RECORD'
    | 'QUERY'
    | 'POLYGON'
    | 'POINT'
    | 'PG_LSN'
    | 'PG_DDL_COMMAND'
    | 'PATH'
    | 'OPAQUE'
    | 'OID'
    | 'NUMERIC'
    | 'NAME'
    | 'MRANGE'
    | 'MONEY'
    | 'MACADDR8'
    | 'MACADDR'
    | 'LSEG'
    | 'LINE'
    | 'LANGUAGE_HANDLER'
    | 'JSONB'
    | 'JSON'
    | 'INTERVAL'
    | 'INTERNAL'
    | 'INT8RANGE'
    | 'INT8'
    | 'INT4RANGE'
    | 'INT4'
    | 'INT2VECTOR'
    | 'INT2'
    | 'INET'
    | 'INDEX_AM_HANDLER'
    | 'FLOAT8'
    | 'FLOAT4'
    | 'FDW_HANDLER'
    | 'EVENT_TRIGGER'
    | 'DATERANGE'
    | 'DATE'
    | 'CSTRING'
    | 'CIRCLE'
    | 'CIDR'
    | 'CID'
    | 'CHAR'
    | 'BYTEA'
    | 'BPCHAR'
    | 'BOX'
    | 'BOOL'
    | 'BIT'
    | 'ACLITEM'
    | 'ABSTIME'
    | 'TIMESTAMP WITHOUT TIME ZONE'
    | 'TIMESTAMP WITH TIME ZONE'
    | 'TIME WITHOUT TIME ZONE'
    | 'TIME WITH TIME ZONE'
    | 'SMALLSERIAL'
    | 'SMALLINT'
    | 'SERIAL'
    | 'REAL'
    | 'NUMERIC'
    | 'INTEGER'
    | 'INT'
    | 'DOUBLE PRECISION'
    | 'CHARACTER VARYING'
    | 'CHARACTER'
    | 'BOOLEAN'
    | 'BIT VARYING'
    | 'BIGSERIAL'
    | 'BIGINT';
}
/**
 * An explicitly specified type of constant tag.
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 * ```
 *                  ┌─type     ┌───────value
 *                  ▼          ▼
 *         ┌────────────────┬─────┐
 *  SELECT │DOUBLE PRECISION│'3.5'│
 *         └────────────────┴─────┘
 *        └────────────────────────┘
 *                     └──▶TypedConstantTag
 * ```
 */
export interface TypedConstantTag extends NodeSqlTag {
  tag: SqlName.TypedConstant;
  values: [type: ConstantTypeTag, value: StringTag];
}

/**
 * The tag representing the specific field we want to extract from a date, using the "EXTRACT" expression
 * https://www.postgresql.org/docs/8.3/functions-datetime.html
 */
export interface ExtractFieldTag extends LeafSqlTag {
  tag: SqlName.ExtractField;
  value:
    | 'CENTURY'
    | 'DAY'
    | 'DECADE'
    | 'DOW'
    | 'DOY'
    | 'EPOCH'
    | 'HOUR'
    | 'ISODOW'
    | 'ISOYEAR'
    | 'JULIAN'
    | 'MICROSECONDS'
    | 'MILLENNIUM'
    | 'MILLISECONDS'
    | 'MINUTE'
    | 'MONTH'
    | 'QUARTER'
    | 'SECOND'
    | 'TIMEZONE'
    | 'TIMEZONE_HOUR'
    | 'TIMEZONE_MINUTE'
    | 'WEEK'
    | 'YEAR';
}
/**
 * Extract expression tag for extracting from dates
 * https://www.postgresql.org/docs/8.3/functions-datetime.html
 * ```
 *                    ┌───field              ┌───value
 *                    ▼                      ▼
 *        ┌ ─ ─ ─ ┬ ┬───┬ ─ ─┌───────────────────────────────┬ ┐
 * SELECT  EXTRACT (│DAY│FROM│TIMESTAMP '2001-02-16 20:38:40'│)
 *        └ ─ ─ ─ ┴ ┴───┴ ─ ─└───────────────────────────────┴ ┘
 *       └──────────────────────────────────────────────────────┘
 *                                   └─▶ExtractTag
 * ```
 */
export interface ExtractTag extends NodeSqlTag {
  tag: SqlName.Extract;
  values: [field: ExtractFieldTag, value: ExpressionTag];
}

/**
 * A tag representing the range inside array index. e.g. 1:2
 * https://www.postgresql.org/docs/current/arrays.html
 * ```
 *                         ┌─from
 *                         │   ┌──to
 *                         ▼   ▼
 *                        ┌─┬ ┬─┐
 * SELECT  array_column [ │1│:│4│]  FROM table1
 *                        └─┴ ┴─┘
 *                       └───────┘
 *                           └─▶ArrayIndexRangeTag
 * ```
 */
export interface ArrayIndexRangeTag extends NodeSqlTag {
  tag: SqlName.ArrayIndexRange;
  values: [from: ExpressionTag, to: ExpressionTag];
}

/**
 * A tag representing an array index accessing an expression. e.g. `my_array[1:2]`
 * https://www.postgresql.org/docs/current/arrays.html
 * ```
 *               ┌───array
 *               │           ┌────index
 *               ▼           ▼
 *         ┌───────────┐   ┌───┐
 * SELECT  │array_colum│ [ │1:5│ ]  FROM table1
 *         └───────────┘   └───┘
 *        └──────────────────────┘
 *                    └─▶ArrayColumnIndexTag
 * ```
 */
export interface ArrayColumnIndexTag extends NodeSqlTag {
  tag: SqlName.ArrayColumnIndex;
  values: [array: ColumnTag, index: ExpressionTag | ArrayIndexRangeTag];
}

/**
 * A tag representing an array index accessing an expression. e.g. `my_array[1:2]`
 * https://www.postgresql.org/docs/current/arrays.html
 * ```
 *                          ┌────index
 *                          ▼
 *                        ┌───┐
 * SELECT  (expression) [ │1:5│ ]  FROM table1
 *                        └───┘
 *                     └─────────┘
 *                          └─▶ArrayIndexTag
 * ```
 */
export interface ArrayIndexTag extends NodeSqlTag {
  tag: SqlName.ArrayIndex;
  values: [index: ExpressionTag | ArrayIndexRangeTag];
}

/**
 * A tag representing an field access to a composite row. e.g. `(item).name`
 * https://www.postgresql.org/docs/9.4/rowtypes.html#ROWTYPES-ACCESSING
 * ```
 *
 *                          ┌────field
 *                          ▼
 *                        ┌────┐
 * SELECT  (expression) . │name│ FROM table1
 *                        └────┘
 *                     └────────┘
 *                          └─▶CompositeAccessTag
 * ```
 */
export interface CompositeAccessTag extends NodeSqlTag {
  tag: SqlName.CompositeAccess;
  values: [field: IdentifierTag];
}

/**
 * A tag representing the "count" part of LIMITs or OFFSETs
 * https://www.postgresql.org/docs/current/queries-limit.html
 */
export interface CountTag extends NodeSqlTag {
  tag: SqlName.Count;
  values: [ParameterTag | IntegerTag];
}

/**
 * A tag denoting a dimension on multi dimensional arrays
 * https://www.postgresql.org/docs/current/arrays.html
 */
export interface DimensionTag extends EmptyLeafSqlTag {
  tag: SqlName.Dimension;
}

/**
 * A tag representing a type with or without parameters
 * ```
 *                           ┌─parameter1
 *           name ───┐       │   ┌─parameter2
 *                   ▼       ▼   ▼
 *               ┌───────┬ ┬──┬ ┬─┬ ┐
 * SELECT '3.5'::│numeric│(│10│,│2│)
 *               └───────┴ ┴──┴ ┴─┴ ┘
 *              └────────────────────┘
 *                         └──▶TypeTag
 * ```
 */
export interface TypeTag extends NodeSqlTag {
  tag: SqlName.Type;
  values:
    | [identifier: QualifiedIdentifierTag]
    | [name: QualifiedIdentifierTag, parameter: IntegerTag]
    | [name: QualifiedIdentifierTag, parameter1: IntegerTag, parameter2: IntegerTag];
}

/**
 * A tag representing array type, with multiple levels of dimensions
 * https://www.postgresql.org/docs/current/arrays.html
 * ```
 *               type─┐   ┌─dimension
 *                    ▼   ▼
 *                  ┌───┬──┬──┐
 * SELECT '{1,2}':: │int│[]│[]│
 *                  └───┴──┴──┘
 *                 └───────────┘
 *                       └─▶ArrayTypeTag
 * ```
 */
export interface ArrayTypeTag extends NodeSqlTag {
  tag: SqlName.ArrayType;
  values: [type: TypeTag, ...dimension: DimensionTag[]];
}

/**
 * A distinct tag, with optionally specifying column names
 * https://www.postgresql.org/docs/current/sql-select.html
 * ```
 *                         ┌─column
 *                         ▼
 *        ┌ ─ ─ ─ ─ ─ ┬ ┬────┬ ┬────┬ ┐
 * SELECT  DISTINCT ON (│col1│,│col2│) * FROM table1
 *        └ ─ ─ ─ ─ ─ ┴ ┴────┴ ┴────┴ ┘
 *       └─────────────────────────────┘
 *                      └─▶DistinctTag
 * ```
 */
export interface DistinctTag extends NodeSqlTag {
  tag: SqlName.Distinct;
  values: ColumnTag[];
}

/**
 * A tag adding a filter to aggregate function
 * https://www.postgresql.org/docs/14/sql-expressions.html
 * ```
 *                                          ┌─condition
 *                                          ▼
 *                        ─ ─ ─ ┬ ┬─────────────────────┬ ┐
 * SELECT array_agg (id) │FILTER (│WHERE visible = TRUE │) FROM table1
 *                        ─ ─ ─ ┴ ┴─────────────────────┴ ┘
 *                      └──────────────────────────────────┘
 *                                       └─▶FilterTag
 * ```
 */
export interface FilterTag extends NodeSqlTag {
  tag: SqlName.Filter;
  values: [condition: WhereTag];
}

/**
 * A tag representing "*", e.g.  SELECT * FROM table1
 */
export interface StarTag extends EmptyLeafSqlTag {
  tag: SqlName.Star;
}

/**
 * A tag reprsenting a qualified "*", e.g. `public.table1.*`
 * https://www.postgresql.org/docs/current/sql-expressions.html#FIELD-SELECTION
 * ```
 *          ┌─schema ┌─table ┌─ star
 *          ▼        ▼       ▼
 *        ┌──────┬ ┬──────┬ ┬─┐
 * SELECT │public│.│table1│.│*│ FROM table1
 *        └──────┴ ┴──────┴ ┴─┘
 *       └─────────────────────┘
 *                  └─▶StarIdentifierTag
 * ```
 */
export interface StarIdentifierTag extends NodeSqlTag {
  tag: SqlName.StarIdentifier;
  values:
    | [schema: IdentifierTag, table: IdentifierTag, star: StarTag]
    | [table: IdentifierTag, star: StarTag]
    | [star: StarTag];
}

/**
 * A tag representing a row constructor with omitted ROW keyword
 * https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-ROW-CONSTRUCTORS
 * ```
 *            ┌─expression
 *            ▼
 *         ┌ ┬─┬ ┬───┬ ┬──────┬ ┐
 *  SELECT  (│1│,│2.5│,│'test'│)
 *         └ ┴─┴ ┴───┴ ┴──────┴ ┘
 *        └──────────────────────┘
 *                 └─▶RowTag
 * ```
 */
export interface RowTag extends NodeSqlTag {
  tag: SqlName.Row;
  values: ExpressionTag[];
}

/**
 * A tag representing a row constructor with explicit ROW keyword
 * https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-ROW-CONSTRUCTORS
 * ```
 *                ┌─expression
 *                ▼
 *         ┌ ─ ┬ ┬─┬ ┬───┬ ┬──────┬ ┐
 *  SELECT  ROW (│1│,│2.5│,│'test'│)
 *         └ ─ ┴ ┴─┴ ┴───┴ ┴──────┴ ┘
 *        └──────────────────────────┘
 *                     └─▶RowTag
 * ```
 */
export interface RowKeywardTag extends NodeSqlTag {
  tag: SqlName.RowKeyward;
  values: ExpressionTag[];
}

/**
 * A tag for "when" in a case conditional.
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 * ```
 *                    ┌── when  ┌── then
 *                    ▼         ▼
 *             ┌ ─ ─┌───┬ ─ ─┌─────┐
 * SELECT CASE  WHEN│a=1│THEN│'one'│ WHEN a=2 THEN 'two' ELSE 'other' END FROM table1
 *             └ ─ ─└───┴ ─ ─└─────┘
 *            └─────────────────────┘
 *                       └─▶WhenTag
 * ```
 */
export interface WhenTag extends NodeSqlTag {
  tag: SqlName.When;
  values: [when: ExpressionTag, then: ExpressionTag];
}

/**
 * A tag for "else" in a case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 * ```
 *                                                     ┌ ─ ─┌───────┐
 *  SELECT CASE WHEN a=1 THEN 'one' WHEN a=2 THEN 'two' ELSE│'other'│ END FROM table1
 *                                                     └ ─ ─└───────┘
 *                                                    └──────────────┘
 *                                                           └─▶ElseTag
 * ```
 */
export interface ElseTag extends NodeSqlTag {
  tag: SqlName.Else;
  values: [ExpressionTag];
}

/**
 * A simple case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 * ```
 *              ┌─▶value  ┌─▶option         ┌─▶option       ┌─▶option
 *        ┌ ─ ─┌─┬─────────────────┬─────────────────┬────────────┬ ─ ┐
 * SELECT  CASE│a│WHEN 1 THEN 'one'│WHEN 2 THEN 'two'│ELSE 'other'│END FROM table1
 *        └ ─ ─└─┴─────────────────┴─────────────────┴────────────┴ ─ ┘
 *       └─────────────────────────────────────────────────────────────┘
 *                                      └─▶CaseSimpleTag
 * ```
 */
export interface CaseSimpleTag extends NodeSqlTag {
  tag: SqlName.CaseSimple;
  values: [value: CastableDataTypeTag, ...options: (WhenTag | ElseTag)[]];
}

/**
 * A normal case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 * ```
 *                      ┌─▶option           ┌─▶option        ┌─▶option
 *       ┌ ─ ─┌───────────────────┬───────────────────┬────────────┬ ─ ┐
 * SELECT CASE│WHEN a=1 THEN 'one'│WHEN a=2 THEN 'two'│ELSE 'other'│END FROM table1
 *       └ ─ ─└───────────────────┴───────────────────┴────────────┴ ─ ┘
 *      └───────────────────────────────────────────────────────────────┘
 *                                    └─▶CaseTag
 * ```
 */
export interface CaseTag extends NodeSqlTag {
  tag: SqlName.Case;
  values: (WhenTag | ElseTag)[];
}

/**
 * The operator of a binary expression, e.g. 1 + 2
 */
export interface BinaryOperatorTag extends LeafSqlTag {
  tag: SqlName.BinaryOperator;
  value:
    | '^'
    | '*'
    | '/'
    | '%'
    | '+'
    | '-'
    | '->>'
    | '->'
    | '#>>'
    | '#>'
    | '<->'
    | '@>'
    | '<@'
    | '?|'
    | '?&'
    | '?'
    | '#-'
    | '||'
    | '|'
    | '&'
    | '#'
    | '~'
    | '!~'
    | '~*'
    | '!~*'
    | '<<'
    | '>>'
    | '@@'
    | 'IS'
    | 'IN'
    | 'LIKE'
    | 'ILIKE'
    | '<='
    | '>='
    | '<'
    | '>'
    | '<>'
    | '!='
    | '='
    | 'AND'
    | 'OR'
    | 'IS NOT DISTINCT FROM'
    | 'IS DISTINCT FROM'
    | 'AT TIME ZONE'
    | 'OVERLAPS';
}

/**
 * The operator of a unary expression, e.g. -2
 */
export interface UnaryOperatorTag extends LeafSqlTag {
  tag: SqlName.UnaryOperator;
  value: '+' | '-' | 'NOT' | 'ISNULL' | 'NOTNULL';
}

/**
 * A binary expression, e.g. 1 + 2
 * If changed (1 + 2 + 2), one of the operands will be a binary expression itself.
 * Depending on the precedence order
 * https://www.postgresql.org/docs/current/typeconv-oper.html
 * ```
 *    left─┐  ┌─operator
 *         │  │   ┌─right
 *         ▼  ▼   ▼
 *       ┌───┬─┬─────┐
 * SELECT│113│+│4 + 2│
 *       └───┴─┴─────┘
 *      └─────────────┘
 *             └▶BinaryExpressionTag
 * ```
 */
export interface BinaryExpressionTag extends NodeSqlTag {
  tag: SqlName.BinaryExpression;
  values: [
    left: DataTypeTag | OperatorExpressionTag,
    operator: BinaryOperatorTag,
    right: DataTypeTag | OperatorExpressionTag,
  ];
}

/**
 * An unary expression e.g. -32
 * https://www.postgresql.org/docs/current/typeconv-oper.html
 * ```
 *        ┌─operator
 *        │  ┌──value
 *        ▼  ▼
 *       ┌─┬───┐
 * SELECT│-│123│
 *       └─┴───┘
 *      └───────┘
 *          └─▶UnaryExpressionTag
 * ```
 */
export interface UnaryExpressionTag extends NodeSqlTag {
  tag: SqlName.UnaryExpression;
  values: [operator: UnaryOperatorTag, value: DataTypeTag | OperatorExpressionTag];
}

/**
 * Ternary operators (operators with 3 arguments). e.g. a BETWEEN 2 AND 3
 */
export interface TernaryOperatorTag extends LeafSqlTag {
  tag: SqlName.TernaryOperator;
  value: 'BETWEEN' | 'NOT BETWEEN' | 'BETWEEN SYMMETRIC' | 'NOT BETWEEN SYMMETRIC';
}

/**
 * Ternary operators (operators with 3 arguments) separator. e.g. the second operator of a ternary.
 */
export interface TernarySeparatorTag extends LeafSqlTag {
  tag: SqlName.TernarySeparator;
  value: 'AND';
}

/**
 * Ternary expression (with 2 operatrs and 3 arguments).
 * https://www.postgresql.org/docs/current/functions-comparison.html
 * ```
 *                     ┌──arg1
 *      operator─┐     │  ┌──separator
 *   value─┐     │     │  │   ┌──arg2
 *         ▼     ▼     ▼  ▼   ▼
 *       ┌───┬───────┬──┬───┬──┐
 * SELECT│col│BETWEEN│12│AND│25│FROM table1
 *       └───┴───────┴──┴───┴──┘
 *      └───────────────────────┘
 *                  └─▶TernaryExpressionTag
 * ```
 */
export interface TernaryExpressionTag extends NodeSqlTag {
  tag: SqlName.TernaryExpression;
  values: [
    value: DataTypeTag,
    operator: TernarySeparatorTag,
    arg1: DataTypeTag,
    separator: TernarySeparatorTag,
    arg2: DataTypeTag,
  ];
}

/**
 * The CAST tag
 * https://www.postgresql.org/docs/14/sql-expressions.html#SQL-SYNTAX-TYPE-CASTS
 * ```
 *                 ┌─data   ┌─type
 *                 ▼        ▼
 *       ┌ ─ ─┌ ┬─────┬ ─┌─────┬ ┐
 * SELECT CAST│(│'3.5'│AS│float│)
 *       └ ─ ─└ ┴─────┴ ─└─────┴ ┘
 *      └─────────────────────────┘
 *                   └─▶CastTag
 * ```
 */
export interface CastTag extends NodeSqlTag {
  tag: SqlName.Cast;
  values: [data: DataTypeTag, type: AnyTypeTag];
}

/**
 * A postgres style cast with "::"
 * https://www.postgresql.org/docs/14/sql-expressions.html#SQL-SYNTAX-TYPE-CASTS
 * ```
 *          ┌─data   ┌─type
 *          ▼        ▼
 *       ┌─────┬ ─┌─────┐
 * SELECT│'3.5'│::│float│
 *       └─────┴ ─└─────┘
 *      └────────────────┘
 *               └──▶PgCastTag
 * ```
 */
export interface PgCastTag extends NodeSqlTag {
  tag: SqlName.PgCast;
  values: [data: DataTypeTag, type: AnyTypeTag];
}

/**
 * Create a constant array with expressions for items, separated by a comma
 * https://www.postgresql.org/docs/14/sql-expressions.html#SQL-SYNTAX-ARRAY-CONSTRUCTORS
 * ```
 *                 ┌─expression
 *                 ▼
 *       ┌ ─ ─ ┬ ┐┌─┬ ┬───┬ ┬───┬ ┐
 * SELECT ARRAY [ │1│,│2.5│,│321│]
 *       └ ─ ─ ┴ ┘└─┴ ┴───┴ ┴───┴ ┘
 *      └──────────────────────────┘
 *                    └─▶ArrayConstructorTag
 * ```
 */
export interface ArrayConstructorTag extends NodeSqlTag {
  tag: SqlName.ArrayConstructor;
  values: ExpressionTag[];
}

/**
 * A generic function. Matches any user-create or built in function,
 * As well as function-like expressions like "GREATEST" and "LEAST"
 * https://www.postgresql.org/docs/14/sql-expressions.html#SQL-EXPRESSIONS-FUNCTION-CALLS
 * ```
 *            ┌─name   ┌─arg
 *            ▼        ▼
 *       ┌─────────┬ ┬───┬ ┬──────┬ ┬───┬ ┐
 * SELECT│CONCAT_WS│(│'_'│,│'test'│,│321│)
 *       └─────────┴ ┴───┴ ┴──────┴ ┴───┴ ┘
 *      └──────────────────────────────────┘
 *                        └─▶FunctionTag
 * ```
 */
export interface FunctionTag extends NodeSqlTag {
  tag: SqlName.Function;
  values: [name: QualifiedIdentifierTag, ...args: (FunctionArgTag | OrderByTag | DistinctTag | FilterTag)[]];
}

/**
 * The type of a row and array comparation
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 */
export interface ComparationArrayInclusionTypeTag extends LeafSqlTag {
  tag: SqlName.ComparationArrayInclusionType;
  value: 'IN' | 'NOT IN';
}

/**
 * THe operator of a row and array comparations
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 */
export interface ComparationArrayOperatorTag extends LeafSqlTag {
  tag: SqlName.ComparationArrayOperator;
  value: '<=' | '>=' | '<' | '>' | '<>' | '!=' | '=' | 'AND' | 'OR';
}

/**
 * The type of a row and array comparation
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 */
export interface ComparationArrayTypeTag extends LeafSqlTag {
  tag: SqlName.ComparationArrayType;
  value: 'ANY' | 'SOME' | 'ALL';
}

/**
 * Comparation with array expresison
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 * ```
 *   value─┐  ┌─type
 *         │  │   ┌─subject
 *         ▼  ▼   ▼
 *       ┌───┬──┬─────────┐
 * SELECT│113│IN│(1, 2, 3)│
 *       └───┴──┴─────────┘
 *      └─────────────────┘
 *             └▶ComparationArrayInclusionTag
 * ```
 */
export interface ComparationArrayInclusionTag extends NodeSqlTag {
  tag: SqlName.ComparationArrayInclusion;
  values: [value: ExpressionTag, type: ComparationArrayInclusionTypeTag, subject: CastableDataTypeTag];
}

/**
 * Comparation with array expresison
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 * ```
 *   value─┐  ┌─operator
 *         │  │  ┌─type   ┌─subject
 *         ▼  ▼  ▼        ▼
 *       ┌───┬─┬───┬────────────┐
 * SELECT│113│=│ANY│(ARRAY[1,2])│
 *       └───┴─┴───┴────────────┘
 *      └────────────────────────┘
 *                  └▶ComparationArrayInclusionTag
 * ```
 */
export interface ComparationArrayTag extends NodeSqlTag {
  tag: SqlName.ComparationArray;
  values: [
    value: ExpressionTag,
    operator: ComparationArrayOperatorTag,
    type: ComparationArrayTypeTag,
    subject: CastableDataTypeTag,
  ];
}

/**
 * Exists expression
 * https://www.postgresql.org/docs/8.1/functions-subquery.html#AEN13171
 * ```
 *                                           ┌─subject
 *                                           ▼
 *                              ┌ ─ ─ ─┌─────────────┐
 * SELECT col1 FROM table1 WHERE EXISTS│(SELECT TRUE)│
 *                              └ ─ ─ ─└─────────────┘
 *                             └──────────────────────┘
 *                                       └▶ComparationArrayInclusionTag
 * ```
 */
export interface ExistsTag extends NodeSqlTag {
  tag: SqlName.Exists;
  values: [subject: SelectTag];
}

/**
 * An item of a select list
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-SELECT-LIST
 * ```
 *                ┌─value  ┌─as
 *                ▼        ▼
 *             ┌────┬ ─┌───────┐
 * SELECT col1,│col2│AS│"test1"│FROM table1
 *             └────┴ ─└───────┘
 *            └─────────────────┘
 *                     └─▶SelectListItemTag
 * ```
 */
export interface SelectListItemTag extends NodeSqlTag {
  tag: SqlName.SelectListItem;
  values: [value: StarIdentifierTag | ExpressionTag] | [value: ExpressionTag, as: AsTag];
}

/**
 * The select list of a select query
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-SELECT-LIST
 * ```
 *              ┌─item
 *              ▼
 *       ┌─────────────┬ ┬───────────────┐
 * SELECT│col1 AS "val"│,│col2 AS "test1"│FROM table1
 *       └─────────────┴ ┴───────────────┘
 *      └─────────────────────────────────┘
 *                       └─▶SelectListTag
 * ```
 */
export interface SelectListTag extends NodeSqlTag {
  tag: SqlName.SelectList;
  values: SelectListItemTag[];
}

/**
 * A select tag accompanied by an alias (required)
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *                            ┌─select       as─┐
 *                            ▼                 ▼
 *              ┌ ┬───────────────────────┬ ┬───────┐
 * SELECT * FROM (│SELECT col1 FROM table1│)│AS tmp1│
 *              └ ┴───────────────────────┴ ┴───────┘
 *             └─────────────────────────────────────┘
 *                                └─▶NamedSelectTag
 * ```
 */
export interface NamedSelectTag extends NodeSqlTag {
  tag: SqlName.NamedSelect;
  values: [select: SelectTag, as: AsTag];
}

/**
 * A type of join from a select tag
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 */
export interface JoinTypeTag extends LeafSqlTag {
  tag: SqlName.JoinType;
  value:
    | 'JOIN'
    | 'INNER JOIN'
    | 'LEFT JOIN'
    | 'LEFT OUTER JOIN'
    | 'RIGHT JOIN'
    | 'RIGHT OUTER JOIN'
    | 'FULL JOIN'
    | 'FULL OUTER JOIN'
    | 'CROSS JOIN';
}

/**
 * Part of a join clause of a select tag
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *                                                ┌─value
 *                                                ▼
 *                                 ┌ ─┌───────────────────────┐
 * SELECT * FROM table1 JOIN table2 ON│ table1.id = table2.id │
 *                                 └ ─└───────────────────────┘
 *                                └────────────────────────────┘
 *                                               └─▶JoinOnTag
 * ```
 */
export interface JoinOnTag extends NodeSqlTag {
  tag: SqlName.JoinOn;
  values: [value: ExpressionTag];
}

/**
 * Part of a join clause of a select tag
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *                                           ┌─value
 *                                           ▼
 *                                 ┌ ─ ─ ┬ ┬──┬ ┐
 * SELECT * FROM table1 JOIN table2 USING (│id│)
 *                                 └ ─ ─ ┴ ┴──┴ ┘
 *                                └──────────────┘
 *                                        └─▶JoinUsing
 * ```
 */
export interface JoinUsingTag extends NodeSqlTag {
  tag: SqlName.JoinUsing;
  values: ColumnTag[];
}

/**
 * Join clause of a select tag
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *                          ┌──type  ┌─table         ┌─condition
 *                          ▼        ▼               ▼
 *                     ┌─────────┬──────┬────────────────────────┐
 * SELECT * FROM table1│LEFT JOIN│table2│ON table1.id = table2.id│
 *                     └─────────┴──────┴────────────────────────┘
 *                    └───────────────────────────────────────────┘
 *                                          └─▶JoinTag
 * ```
 */
export interface JoinTag extends NodeSqlTag {
  tag: SqlName.Join;
  values:
    | [type: JoinTypeTag, table: TableTag]
    | [type: JoinTypeTag, table: TableWithJoinTag]
    | [type: JoinTypeTag, table: TableTag, condition: JoinOnTag | JoinUsingTag];
}

/**
 * A list of tables / selects
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *      table─┐     ┌─item
 *            ▼     ▼
 *         ┌ ─ ─┌──────┐─┌──────┐
 * SELECT * FROM│table1│,│table2│WHERE table1.id = table2.id
 *         └ ─ ─└──────┘─└──────┘
 *        └──────────────────────┘
 *                    │
 *                    └─▶FromListTag
 * ```
 */
export interface FromListTag extends NodeSqlTag {
  tag: SqlName.FromList;
  values: FromListItemTag[];
}

/**
 * A from tag that combines from clause plus joins
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM
 * ```
 *                ┌─list                   ┌─join
 *                ▼                        ▼
 *          ┌───────────┬────────────────────────────────────┐
 * SELECT * │FROM table1│JOIN table2 ON table1.id = table2.id│
 *          └───────────┴────────────────────────────────────┘
 *         └──────────────────────────────────────────────────┘
 *                                   └─▶FromTag
 * ```
 */
export interface FromTag extends NodeSqlTag {
  tag: SqlName.From;
  values: [list: FromListTag, ...join: JoinTag[]];
}

/**
 * A Where tag with its conditional expression
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-WHERE
 * ```
 *                                ┌─condition
 *                                ▼
 *                     ┌ ─ ─ ┬────────┐
 * SELECT * FROM table1 WHERE│col1 > 2│
 *                     └ ─ ─ ┴────────┘
 *                    └────────────────┘
 *                             └─▶WhereTag
 * ```
 */
export interface WhereTag extends NodeSqlTag {
  tag: SqlName.Where;
  values: [condition: ExpressionTag];
}

/**
 * A Group by tag with its conditional expression
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-GROUPBY
 * ```
 *                                 ┌─column
 *                                 ▼
 *                     ┌ ─ ─ ─ ─┌────┐
 * SELECT * FROM table1 GROUP BY│col1│
 *                     └ ─ ─ ─ ─└────┘
 *                    └───────────────┘
 *                            └─▶GroupByTag
 * ```
 */
export interface GroupByTag extends NodeSqlTag {
  tag: SqlName.GroupBy;
  values: ColumnTag[];
}

/**
 * A Having tag with its conditional expression
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-HAVING
 * ```
 *                                 ┌─condition
 *                                 ▼
 *                     ┌ ─ ─ ─┌────────┐
 * SELECT * FROM table1 HAVING│col1 > 2│
 *                     └ ─ ─ ─└────────┘
 *                    └─────────────────┘
 *                             └─▶WhereTag
 * ```
 */
export interface HavingTag extends NodeSqlTag {
  tag: SqlName.Having;
  values: [condtion: ExpressionTag];
}

/**
 * Combination of multiple selects
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-UNION
 */
export interface CombinationTypeTag extends LeafSqlTag {
  tag: SqlName.CombinationType;
  value: 'UNION' | 'INTERSECT' | 'EXCEPT' | 'UNION ALL' | 'INTERSECT ALL' | 'EXCEPT ALL';
}

/**
 * Combination select
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-UNION
 * ```
 *                        ┌─type        ┌─parts
 *                        ▼             ▼
 *                     ┌─────┬─────────────────────┐
 * SELECT * FROM table1│UNION│SELECT * FROM table2 │
 *                     └─────┴─────────────────────┘
 *                    └─────────────────────────────┘
 *                                   └─▶CombinationTag
 * ```
 */
export interface CombinationTag extends NodeSqlTag {
  tag: SqlName.Combination;
  values: [type: CombinationTypeTag, ...parts: SelectParts[]];
}

/**
 * The type of ordering - asc / desc
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-ORDERBY
 */
export interface OrderDirectionTag extends LeafSqlTag {
  tag: SqlName.OrderDirection;
  value: 'ASC' | 'DESC' | 'USNIG >' | 'USING <';
}

/**
 * Item of the order by clause
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-ORDERBY
 * ```
 *                            order─┐   ┌─direction
 *                                  ▼   ▼
 *                               ┌────┬───┐
 * SELECT * FROM table1 ORDER BY │col1│ASC│
 *                               └────┴───┘
 *                              └──────────┘
 *                                    └─▶OrderByItemTag
 * ```
 */
export interface OrderByItemTag extends NodeSqlTag {
  tag: SqlName.OrderByItem;
  values: [order: ExpressionTag] | [order: ExpressionTag, direction: OrderDirectionTag];
}
/**
 * Order by clause
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-ORDERBY
 * ```
 *                        order item─┐
 *                                   ▼
 *                     ┌ ─ ─ ─ ─┌────────┐
 * SELECT * FROM table1 ORDER BY│col1 ASC│
 *                     └ ─ ─ ─ ─└────────┘
 *                    └───────────────────┘
 *                              └─▶OrderByTag
 * ```
 */
export interface OrderByTag extends NodeSqlTag {
  tag: SqlName.OrderBy;
  values: OrderByItemTag[];
}
/**
 * Limit clause
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-LIMIT
 * ```
 *                       count─┐
 *                             ▼
 *                     ┌ ─ ─ ┬──┐
 * SELECT * FROM table1 LIMIT│10│
 *                     └ ─ ─ ┴──┘
 *                    └──────────┘
 *                          └─▶LimitTag
 * ```
 */
export interface LimitTag extends NodeSqlTag {
  tag: SqlName.Limit;
  values: [CountTag | LimitAllTag];
}

/**
 * the "ALL" token in the limit clause, used instead of count.
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-LIMIT
 */
export interface LimitAllTag extends EmptyLeafSqlTag {
  tag: SqlName.LimitAll;
}

/**
 * Offset clause
 * https://www.postgresql.org/docs/current/sql-select.html#SQL-LIMIT
 * ```
 *                                count──┐
 *                                       ▼
 *                              ┌ ─ ─ ─┌───┐
 * SELECT * FROM table1 LIMIT 10 OFFSET│100│
 *                              └ ─ ─ ─└───┘
 *                             └────────────┘
 *                                   └─▶OffsetTag
 * ```
 */
export interface OffsetTag extends NodeSqlTag {
  tag: SqlName.Offset;
  values: [CountTag];
}

/**
 * Select Tag
 * https://www.postgresql.org/docs/current/sql-select.html
 * ```
 *            part─┐
 *                 ▼
 *  ┌ ─ ─ ─┌─┬───────────┬───────────┐
 *   SELECT│*│FROM table1│ LIMIT 10  │
 *  └ ─ ─ ─└─┴───────────┴───────────┘
 * └──────────────────────────────────┘
 *                   └─▶SelectTag
 * ```
 */
export interface SelectTag extends NodeSqlTag {
  tag: SqlName.Select;
  values: (SelectParts | OrderByTag | CombinationTag | LimitTag | OffsetTag)[];
}

/**
 * Default token for UPDATEs and INSERTs
 * ```
 */
export interface DefaultTag extends EmptyLeafSqlTag {
  tag: SqlName.Default;
}

/**
 * Setting of a specific column in an UPDATE query
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                     value─┐
 *                           ▼
 *                  ┌ ─ ─ ─┌───┐
 * UPDATE table1 SET col1 =│100│
 *                  └ ─ ─ ─└───┘
 *                 └────────────┘
 *                       └─▶SetItemTag
 * ```
 */
export interface SetItemTag extends NodeSqlTag {
  tag: SqlName.SetItem;
  values: [column: IdentifierTag, value: ExpressionTag | DefaultTag];
}

/**
 * Setting of a columns in an UPDATE tag
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                       item─┐
 *                            ▼
 *                  ┌ ─ ┬──────────┐
 *    UPDATE table1  SET│col1 = 100│
 *                  └ ─ ┴──────────┘
 *                 └────────────────┘
 *                          └─▶SetListTag
 * ```
 */
export interface SetListTag extends NodeSqlTag {
  tag: SqlName.SetList;
  values: SetItemTag[];
}

/**
 * Picking specific columns in an INSERT query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 *                   item─┐
 *                        ▼
 *                   ┌ ┬────┬ ┬────┬ ┐
 * INSERT INTO table1 (│col1│,│col2│) VALUES (1, 2)
 *                   └ ┴────┴ ┴────┴ ┘
 *                  └─────────────────┘
 *                           └─▶ColumnsTag
 * ```
 */
export interface ColumnsTag extends NodeSqlTag {
  tag: SqlName.Columns;
  values: IdentifierTag[];
}

/**
 * Picking specific columns in an INSERT query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 *                                      item─┐
 *                                           ▼
 *                                       ┌ ┬────┬ ┬───────┬ ┐
 * INSERT INTO table1 (col1, col2) VALUES│(│123 │,│DEFAULT│)
 *                                       └ ┴────┴ ┴───────┴ ┘
 *                                      └────────────────────┘
 *                                                 └─▶ValuesTag
 * ```
 */
export interface ValuesTag extends NodeSqlTag {
  tag: SqlName.Values;
  values: (ExpressionTag | DefaultTag)[];
}

/**
 * Setting of a columns and values in an UPDATE query
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                  columns─┐             ┌─values
 *                          ▼             ▼
 *                   ┌────────────┬ ┬──────────┐
 * UPDATE table1  SET│(col1, col2)│=│(100, 200)│
 *                   └────────────┴ ┴──────────┘
 *                  └───────────────────────────┘
 *                                └─▶SetMapTag
 * ```
 */
export interface SetMapTag extends NodeSqlTag {
  tag: SqlName.SetMap;
  values: [columns: ColumnsTag, values: ValuesTag | SelectTag];
}

/**
 * Set part of an update query
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                          value─┐
 *                                ▼
 *               ┌ ─ ┬─────────────────────────┐
 * UPDATE table1  SET│(col1, col2) = (100, 200)│
 *               └ ─ ┴─────────────────────────┘
 *              └───────────────────────────────┘
 *                              └─▶SetTag
 * ```
 */
export interface SetTag extends NodeSqlTag {
  tag: SqlName.Set;
  values: [SetListTag | SetMapTag];
}

/**
 * An identifier that can be fully qualified with a schema.
 */
export interface QualifiedIdentifierTag extends NodeSqlTag {
  tag: SqlName.QualifiedIdentifier;
  values: [schema: IdentifierTag, table: IdentifierTag] | [table: IdentifierTag];
}

/**
 * Table name, with an optional alias
 * ```
 *            table─┐        ┌─as
 *                  ▼        ▼
 *              ┌──────┬ ─┌────┐
 * SELECT * FROM│table1│AS│tmp1│
 *              └──────┴ ─└────┘
 *             └────────────────┘
 *                      └───────▶TableTag
 * ```
 */
export interface TableTag extends NodeSqlTag {
  tag: SqlName.Table;
  values: [table: QualifiedIdentifierTag] | [table: QualifiedIdentifierTag, as: AsTag];
}

/**
 * Form clause of an update query.
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                                         item─┐
 *                                              ▼
 *                                     ┌ ─ ─┌──────┐
 * UPDATE table1 SET col1 = table2.col2 FROM│table2│WHERE table2.id = table1.id
 *                                     └ ─ ─└──────┘
 *                                    └─────────────┘
 *                                           └─▶UpdateFromTag
 * ```
 */
export interface UpdateFromTag extends NodeSqlTag {
  tag: SqlName.UpdateFrom;
  values: FromListItemTag[];
}

/**
 * Returning clause of an update query.
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *                                            value─┐   as─┐
 *                                                  ▼      ▼
 *                                               ┌────┬ ─┌────┐
 * UPDATE table1 SET col1 = table2.col2 RETURNING│col1│AS│tmp1│
 *                                               └────┴ ─└────┘
 *                                              └──────────────┘
 *                                                     └─▶ReturningListItemTag
 * ```
 */
export interface ReturningListItemTag extends NodeSqlTag {
  tag: SqlName.ReturningListItem;
  values: [value: StarIdentifierTag | ExpressionTag] | [value: ExpressionTag, as: AsTag];
}

/**
 * Returning clause
 * ```
 *                                                 item─┐
 *                                                      ▼
 *                                     ┌ ─ ─ ─ ─ ┬────────────┐
 * UPDATE table1 SET col1 = table2.col2 RETURNING│col1 AS tmp1│
 *                                     └ ─ ─ ─ ─ ┴────────────┘
 *                                    └────────────────────────┘
 *                                                 └─▶ReturningTag
 * ```
 */
export interface ReturningTag extends NodeSqlTag {
  tag: SqlName.Returning;
  values: ReturningListItemTag[];
}

/**
 * Update query
 * https://www.postgresql.org/docs/current/sql-update.html
 * ```
 *        part─┐
 *             ▼
 *  ┌ ─ ─ ─┌──────┬──────────────────────┐
 *   UPDATE│table1│SET col1 = table2.col2│
 *  └ ─ ─ ─└──────┴──────────────────────┘
 * └──────────────────────────────────────┘
 *                     └─▶UpdateTag
 * ```
 */
export interface UpdateTag extends NodeSqlTag {
  tag: SqlName.Update;
  values: (SetTag | TableTag | UpdateFromTag | WhereTag | ReturningTag)[];
}

/**
 * Using clause of an delete query.
 * https://www.postgresql.org/docs/current/sql-delete.html
 * ```
 *                       item─┐
 *                            ▼
 *                   ┌ ─ ─ ┬──────┐
 * DELETE FROM table1 USING│table2│WHERE table2.id = table1.id
 *                   └ ─ ─ ┴──────┘
 *                  └─────────────┘
 *                         └─▶UsingTag
 * ```
 */
export interface UsingTag extends NodeSqlTag {
  tag: SqlName.Using;
  values: FromListItemTag[];
}

/**
 * Delete query
 * https://www.postgresql.org/docs/current/sql-delete.html
 * ```
 *            part─┐
 *                 ▼
 *  ┌ ─ ─ ─ ─ ─ ┬──────┬────────────────┐
 *   DELETE FROM│table1│WHERE col1 = 123│
 *  └ ─ ─ ─ ─ ─ ┴──────┴────────────────┘
 * └─────────────────────────────────────┘
 *                   └─▶DeleteTag
 * ```
 */
export interface DeleteTag extends NodeSqlTag {
  tag: SqlName.Delete;
  values: (TableTag | UsingTag | WhereTag | ReturningTag)[];
}

/**
 * Values Clause for INSERT query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 *                                        item─┐
 *                                             ▼
 *                                ┌ ─ ─ ─ ┬──────────────┐
 * INSERT INTO table1 (col1, col2) VALUES │(123, DEFAULT)│
 *                                └ ─ ─ ─ ┴──────────────┘
 *                               └────────────────────────┘
 *                                          └─▶ValuesListTag
 * ```
 */
export interface ValuesListTag extends NodeSqlTag {
  tag: SqlName.ValuesList;
  values: (ParameterTag | ValuesTag)[];
}

/**
 * Collate in on conflict issert
 * https://www.postgresql.org/docs/current/sql-insert.html
 */
export interface CollateTag extends LeafSqlTag {
  tag: SqlName.Collate;
  value: string;
}

/**
 * Conflict target index clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2)
 * VALUES (1, 2)
 *
 *            item─┐
 *                 ▼
 *             ─┌────┬ ┐
 * ON CONFLICT│(│col1│)│WHERE col1 IS NOT NULL│DO NOTHING
 *             ─└────┴ ┘
 *           └──────────┘
 *                 └─▶ConflictTargetTag
 * ```
 */
export interface ConflictTargetIndexTag extends NodeSqlTag {
  tag: SqlName.ConflictTargetIndex;
  values: [index: ColumnTag | WrappedExpressionTag] | [index: ColumnTag | WrappedExpressionTag, collate: CollateTag];
}

/**
 * Conflict target clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2)
 * VALUES (1, 2)
 *
 *            item─┐
 *                 ▼
 *             ─┌────┬ ┬──────────────────────┐
 * ON CONFLICT│(│col1│)│WHERE col1 IS NOT NULL│DO NOTHING
 *             ─└────┴ ┴──────────────────────┘
 *           └─────────────────────────────────┘
 *                             └─▶ConflictTargetTag
 * ```
 */
export interface ConflictTargetTag extends NodeSqlTag {
  tag: SqlName.ConflictTarget;
  values: ConflictTargetIndexTag[] | [...indexes: ConflictTargetIndexTag[], where: WhereTag];
}

/**
 * Conflict constraint clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2) VALUES (1, 2)
 *                         value─┐
 *                               ▼
 *             ─ ─ ─ ─ ─ ─ ─┌─────────┐
 * ON CONFLICT│ON CONSTRAINT│col1_uniq│DO NOTHING
 *             ─ ─ ─ ─ ─ ─ ─└─────────┘
 *           └─────────────────────────┘
 *                        └─▶ConflictConstraintTag
 * ```
 */
export interface ConflictConstraintTag extends LeafSqlTag {
  tag: SqlName.ConflictConstraint;
  value: string;
}

/**
 * Do nothing clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2) VALUES (1, 2)
 *                  ─ ─ ─ ─ ─ ┐
 * ON CONFLICT (id)│DO NOTHING
 *                  ─ ─ ─ ─ ─ ┘
 *                └────────────┘
 *                       └─▶DoNothingTag
 * ```
 */
export interface DoNothingTag extends LeafSqlTag {
  tag: SqlName.DoNothing;
}

/**
 * Do nothing clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2) VALUES (1, 2)
 *
 *                                 value──┐
 *                                        ▼
 *                  ─ ─ ─ ─ ─┌────────────────────────┐
 * ON CONFLICT (id)│DO UPDATE│SET col1 = EXCLUDED.col1│
 *                  ─ ─ ─ ─ ─└────────────────────────┘
 *                └────────────────────────────────────┘
 *                                   └─▶DoUpdateTag
 * ```
 */
export interface DoUpdateTag extends NodeSqlTag {
  tag: SqlName.DoUpdate;
  values: [set: SetTag] | [set: SetTag, where: WhereTag];
}

/**
 * Conflict clause on insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * INSERT INTO table1 (col1, col2) VALUES (1, 2)
 * ┌ ─ ─ ─ ─ ─ ┬───────────────┐
 *  ON CONFLICT (id) DO NOTHING│
 * └ ─ ─ ─ ─ ─ ┴───────────────┘
 *└─────────────────────────────┘
 *             └─▶ConflictTag
 * ```
 */
export interface ConflictTag extends NodeSqlTag {
  tag: SqlName.Conflict;
  values: (ConflictTargetTag | ConflictConstraintTag | DoNothingTag | DoUpdateTag)[];
}

/**
 * Insert query
 * https://www.postgresql.org/docs/current/sql-insert.html
 * ```
 * ┌ ─ ─ ─ ─ ─ ┬──────┬────────────┬─────────────┐
 *  INSERT INTO table1│(col1, col2)│VALUES (1, 2)│
 * └ ─ ─ ─ ─ ─ ┴──────┴────────────┴─────────────┘
 *└───────────────────────────────────────────────┘
 *                       └─▶InsertTag
 * ```
 */
export interface InsertTag extends NodeSqlTag {
  tag: SqlName.Insert;
  values: (TableTag | SelectTag | ValuesListTag | ConflictTag | ColumnsTag | ReturningTag)[];
}

/**
 * An expression, wrapped in brackets ().
 * Can have an array index or a composite access tag
 *
 * ```
 * SELECT (record).field, (array)[1]
 * ```
 */
export interface WrappedExpressionTag extends NodeSqlTag {
  tag: SqlName.WrappedExpression;
  values: [ExpressionTag] | [ExpressionTag, CompositeAccessTag | ArrayIndexTag];
}

/**
 * A join expression, wrapped in brackets ()
 */
export interface TableWithJoinTag extends NodeSqlTag {
  tag: SqlName.TableWithJoin;
  values: [table: TableTag, ...joins: JoinTag[]];
}

/**
 * A list of expressions, separated by comma (,)
 */
export interface ExpressionListTag extends NodeSqlTag {
  tag: SqlName.ExpressionList;
  values: ExpressionTag[];
}

/**
 * BEGIN query
 * https://www.postgresql.org/docs/current/tutorial-transactions.html
 */
export interface BeginTag extends EmptyLeafSqlTag {
  tag: SqlName.Begin;
}

/**
 * COMMIT query
 * https://www.postgresql.org/docs/current/tutorial-transactions.html
 */
export interface CommitTag extends EmptyLeafSqlTag {
  tag: SqlName.Commit;
}

/**
 * Savepoint query
 * https://www.postgresql.org/docs/current/tutorial-transactions.html
 */
export interface SavepointTag extends NodeSqlTag {
  tag: SqlName.Savepoint;
  values: [IdentifierTag];
}

/**
 * Rollback query
 * https://www.postgresql.org/docs/current/tutorial-transactions.html
 */
export interface RollbackTag extends NodeSqlTag {
  tag: SqlName.Rollback;
  values: [] | [IdentifierTag];
}

export type IdentifierTag = QuotedIdentifierTag | UnquotedIdentifierTag;
export type FromListItemTag = NamedSelectTag | TableTag;
export type ConstantTag =
  | StringTag
  | BitStringTag
  | HexademicalStringTag
  | EscapeStringTag
  | DollarQuotedStringTag
  | CustomQuotedStringTag
  | NumberTag
  | BooleanTag
  | TypedConstantTag;
export type AnyTypeTag = TypeTag | ArrayTypeTag;
export type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
export type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
export type AnyCastTag = CastTag | PgCastTag;
export type DataTypeTag = NullTag | CaseTag | CaseSimpleTag | CastableDataTypeTag;
export type QueryTag = SelectTag | UpdateTag | InsertTag | DeleteTag;
export type TransactionTag = BeginTag | CommitTag | SavepointTag | RollbackTag;

export type CastableDataTypeTag =
  | ArrayColumnIndexTag
  | ColumnTag
  | ConstantTag
  | FunctionTag
  | ParameterTag
  | PgCastTag
  | SelectTag;

export type ExpressionTag =
  | AnyCastTag
  | ExtractTag
  | TernaryExpressionTag
  | ComparationArrayTag
  | ComparationArrayInclusionTag
  | ExistsTag
  | CaseTag
  | CaseSimpleTag
  | DataTypeTag
  | OperatorExpressionTag
  | RowTag
  | RowKeywardTag
  | WrappedExpressionTag;

export type FunctionArgTag = ExpressionTag | StarIdentifierTag;

/**
 * All the types extending {@link EmptyLeafSqlTag}.
 * Each one should have "value" with a string content
 */
export type EmptyLeafTag =
  | NullTag
  | StarTag
  | DefaultTag
  | DoNothingTag
  | LimitAllTag
  | DimensionTag
  | BeginTag
  | CommitTag;

/**
 * All the types extending {@link LeafSqlTag}.
 * Each one should have "value" with a string content
 */
export type LeafTag =
  | ExtractFieldTag
  | BitStringTag
  | HexademicalStringTag
  | EscapeStringTag
  | ConstantTypeTag
  | TernaryOperatorTag
  | TernarySeparatorTag
  | QuotedIdentifierTag
  | UnquotedIdentifierTag
  | ParameterTag
  | StringTag
  | DollarQuotedStringTag
  | CustomQuotedStringTag
  | NumberTag
  | IntegerTag
  | BooleanTag
  | BinaryOperatorTag
  | UnaryOperatorTag
  | ComparationArrayInclusionTypeTag
  | ComparationArrayOperatorTag
  | ComparationArrayTypeTag
  | JoinTypeTag
  | OrderDirectionTag
  | CollateTag
  | ConflictConstraintTag
  | CombinationTypeTag;

/**
 * All the types extending {@link NodeSqlTag}.
 * Each one should have "values" that holds child nodes
 */
export type NodeTag =
  | SavepointTag
  | RollbackTag
  | ExtractTag
  | TypedConstantTag
  | TypeTag
  | JoinTag
  | TableWithJoinTag
  | CTETag
  | CTENameTag
  | CTEValuesTag
  | CTEValuesListTag
  | WithTag
  | ColumnTag
  | AsTag
  | ArrayIndexRangeTag
  | ArrayIndexTag
  | ArrayColumnIndexTag
  | CompositeAccessTag
  | CountTag
  | ArrayTypeTag
  | DistinctTag
  | FilterTag
  | StarIdentifierTag
  | RowTag
  | RowKeywardTag
  | WhenTag
  | ElseTag
  | CaseSimpleTag
  | CaseTag
  | BinaryExpressionTag
  | UnaryExpressionTag
  | TernaryExpressionTag
  | CastTag
  | PgCastTag
  | ArrayConstructorTag
  | FunctionTag
  | ComparationArrayTag
  | ComparationArrayInclusionTag
  | ExistsTag
  | SelectListItemTag
  | SelectListTag
  | NamedSelectTag
  | JoinOnTag
  | JoinUsingTag
  | FromListTag
  | FromTag
  | WhereTag
  | GroupByTag
  | HavingTag
  | CombinationTag
  | OrderByItemTag
  | OrderByTag
  | LimitTag
  | OffsetTag
  | SelectTag
  | SetItemTag
  | SetListTag
  | ColumnsTag
  | ValuesTag
  | SetMapTag
  | SetTag
  | QualifiedIdentifierTag
  | TableTag
  | UpdateFromTag
  | ReturningListItemTag
  | ReturningTag
  | UpdateTag
  | UsingTag
  | DeleteTag
  | ValuesListTag
  | ConflictTargetIndexTag
  | ConflictTargetTag
  | DoUpdateTag
  | ConflictTag
  | InsertTag
  | WrappedExpressionTag
  | ExpressionListTag;

export type Tag = EmptyLeafTag | LeafTag | NodeTag;

export type AstTag = QueryTag | WithTag | TransactionTag;
