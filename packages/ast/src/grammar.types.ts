export interface SqlTag {
  pos: number;
  nextPos: number;
  tag: string;
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
 * Common Table Expression
 * Representing one of the additional queries of a With Expression
 * https://www.postgresql.org/docs/current/queries-with.html
 *
 *       ┌─── name
 *       ▼                                          ─┐
 * ┌ ─ ─┌─┬ ─               ┌─── query               │
 *  WITH│t│AS│              ▼                        │
 * └ ┬ ┬┴─┴─────────────────────────────────────┬ ┐  │──▶  CTE
 *    (│UPDATE products SET price = price * 1.05│)   │
 *   └ ┴────────────────────────────────────────┴ ┘  │
 *                                                  ─┘
 *  SELECT * FROM t;
 */
export interface CTETag extends NodeSqlTag {
  tag: 'CTE';
  values: [name: IdentifierTag, query: QueryTag];
}

/**
 * With Expression
 * https://www.postgresql.org/docs/current/queries-with.html
 *
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
 */
export interface WithTag extends NodeSqlTag {
  tag: 'With';
  values: [...cte: CTETag[], query: QueryTag];
}

/**
 * Representing the token "NULL"
 */
export interface NullTag extends EmptyLeafSqlTag {
  tag: 'Null';
}

/**
 * An identifier token, naming various things - columns, tables, collations etc.
 * https://www.postgresql.org/docs/current/sql-syntax-lexical.html
 */
export interface UnquotedIdentifierTag extends LeafSqlTag {
  tag: 'UnquotedIdentifier';
  value: string;
}

/**
 * Quoted identifier token (with double quotes), naming various things - columns, tables, collations etc.
 * https://www.postgresql.org/docs/current/sql-syntax-lexical.html
 */
export interface QuotedIdentifierTag extends LeafSqlTag {
  tag: 'QuotedIdentifier';
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
  tag: 'Parameter';
  type: 'spread' | 'single';
  value: string;
  required: boolean;
  pick: UnquotedIdentifierTag[];
}

/**
 * Column Tag, representing qualified or unqulified names
 * https://www.postgresql.org/docs/current/sql-expressions.html#FIELD-SELECTION
 *
 *            ┌─schema ┌─table   ┌─ name
 *            ▼        ▼         ▼
 *        ┌──────┬ ┬──────┬ ┬─────────┐
 * SELECT │public│.│table1│.│my_column│ FROM table1
 *        └──────┴ ┴──────┴ ┴─────────┘
 *       └─────────────────────────────┘
 *                      └─▶ColumnTag
 */
export interface ColumnTag extends NodeSqlTag {
  tag: 'Column';
  values:
    | [schema: IdentifierTag, table: IdentifierTag, name: IdentifierTag]
    | [table: IdentifierTag, name: IdentifierTag]
    | [name: IdentifierTag];
}

/**
 * "As" tag desginating an alias for tables or columns
 *
 *                        ┌──── name
 *                        ▼
 *                   ┌ ─┌───┐
 * SELECT  my_column  AS│"m"│ FROM table1
 *                   └ ─└───┘
 *                  └────────┘
 *                       └─▶AsTag
 */
export interface AsTag extends NodeSqlTag {
  tag: 'As';
  values: [IdentifierTag];
}

/**
 * A string tag, quoted in single quote, e.g. 'my value'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface StringTag extends LeafSqlTag {
  tag: 'String';
  value: string;
}

/**
 * A dollar string tag, - a string quoted by $$, e.g. $$my weird value$$
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface DollarQuotedStringTag extends LeafSqlTag {
  tag: 'DollarQuotedString';
  value: string;
}

/**
 * A custom quoted string tag, - a string quoted by $$, e.g. $TAG$my more weird value$TAG$
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface CustomQuotedStringTag extends LeafSqlTag {
  tag: 'CustomQuotedString';
  delimiter: string;
  value: string;
}

/**
 * A string representing a binary value, prefixed with a B', e.g. B'1101'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface BitStringTag extends LeafSqlTag {
  tag: 'BitString';
  value: string;
}

/**
 * A string representing a hexademical value, prefixed with a X', e.g. B'AF21'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface HexademicalStringTag extends LeafSqlTag {
  tag: 'HexademicalString';
  value: string;
}

/**
 * An "escape" string constant for a C-Style Escape. prefixed by E', e.g. E'\o\o'
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface EscapeStringTag extends LeafSqlTag {
  tag: 'EscapeString';
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
  tag: 'Number';
  value: string;
}

/**
 * A tag representing an integer number, e.g. 12
 */
export interface IntegerTag extends LeafSqlTag {
  tag: 'Integer';
  value: string;
}

/**
 * A tag representing a boolean constant, e.g. TRUE
 */
export interface BooleanTag extends LeafSqlTag {
  tag: 'Boolean';
  value: 'TRUE' | 'FALSE';
}

/**
 * A tag represinting the type of typed constant
 *
 * https://www.postgresql.org/docs/14/sql-syntax-lexical.html
 */
export interface ConstantTypeTag extends LeafSqlTag {
  tag: 'ConstantType';
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
 *
 *                  ┌─type     ┌───────value
 *                  ▼          ▼
 *         ┌────────────────┬─────┐
 *  SELECT │DOUBLE PRECISION│'3.5'│
 *         └────────────────┴─────┘
 *        └────────────────────────┘
 *                     └──▶TypedConstantTag
 */
export interface TypedConstantTag extends NodeSqlTag {
  tag: 'TypedConstant';
  values: [type: ConstantTypeTag, value: StringTag];
}

/**
 * The tag representing the specific field we want to extract from a date, using the "EXTRACT" expression
 * https://www.postgresql.org/docs/8.3/functions-datetime.html
 */
export interface ExtractFieldTag extends LeafSqlTag {
  tag: 'ExtractField';
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
 *
 *                    ┌───field              ┌───value
 *                    ▼                      ▼
 *        ┌ ─ ─ ─ ┬ ┬───┬ ─ ─┌───────────────────────────────┬ ┐
 * SELECT  EXTRACT (│DAY│FROM│TIMESTAMP '2001-02-16 20:38:40'│)
 *        └ ─ ─ ─ ┴ ┴───┴ ─ ─└───────────────────────────────┴ ┘
 *       └──────────────────────────────────────────────────────┘
 *                                   └─▶ExtractTag
 */
export interface ExtractTag extends NodeSqlTag {
  tag: 'Extract';
  values: [field: ExtractFieldTag, value: ExpressionTag];
}

/**
 * A tag representing the range inside array index. e.g. 1:2
 * https://www.postgresql.org/docs/current/arrays.html
 *
 *                         ┌─from
 *                         │   ┌──to
 *                         ▼   ▼
 *                        ┌─┬ ┬─┐
 * SELECT  array_column [ │1│:│4│]  FROM table1
 *                        └─┴ ┴─┘
 *                       └───────┘
 *                           └─▶ArrayIndexRangeTag
 */
export interface ArrayIndexRangeTag extends NodeSqlTag {
  tag: 'ArrayIndexRange';
  values: [from: ExpressionTag, to: ExpressionTag];
}

/**
 * A tag representing an array index accessing an expression. e.g. `my_array[1:2]`
 * https://www.postgresql.org/docs/current/arrays.html
 *
 *               ┌───array
 *               │           ┌────index
 *               ▼           ▼
 *         ┌───────────┐   ┌───┐
 * SELECT  │array_colum│ [ │1:5│ ]  FROM table1
 *         └───────────┘   └───┘
 *        └──────────────────────┘
 *                    └─▶ArrayIndexTag
 */
export interface ArrayIndexTag extends NodeSqlTag {
  tag: 'ArrayIndex';
  values: [array: ExpressionTag, index: ExpressionTag | ArrayIndexRangeTag];
}

/**
 * A tag representing the "count" part of LIMITs or OFFSETs
 * https://www.postgresql.org/docs/current/queries-limit.html
 */
export interface CountTag extends NodeSqlTag {
  tag: 'Count';
  values: [ParameterTag | IntegerTag];
}

/**
 * A tag denoting a dimension on multi dimensional arrays
 * https://www.postgresql.org/docs/current/arrays.html
 */
export interface DimensionTag extends EmptyLeafSqlTag {
  tag: 'Dimension';
}

/**
 * A tag representing a type with or without parameters
 *
 *                           ┌─parameter1
 *           name ───┐       │   ┌─parameter2
 *                   ▼       ▼   ▼
 *               ┌───────┬ ┬──┬ ┬─┬ ┐
 * SELECT '3.5'::│numeric│(│10│,│2│)
 *               └───────┴ ┴──┴ ┴─┴ ┘
 *              └────────────────────┘
 *                         └──▶TypeTag
 */
export interface TypeTag extends NodeSqlTag {
  tag: 'Type';
  values:
    | [name: IdentifierTag]
    | [name: IdentifierTag, parameter: IntegerTag]
    | [name: IdentifierTag, parameter1: IntegerTag, parameter2: IntegerTag];
}

/**
 * A tag representing array type, with multiple levels of dimensions
 * https://www.postgresql.org/docs/current/arrays.html
 *
 *            type────┐   ┌────dimension
 *                    ▼   ▼
 *                  ┌───┬──┬──┐
 * SELECT '{1,2}':: │int│[]│[]│
 *                  └───┴──┴──┘
 *                 └───────────┘
 *                       └─▶TypeArrayTag
 */
export interface TypeArrayTag extends NodeSqlTag {
  tag: 'TypeArray';
  values: [type: TypeTag, ...dimension: DimensionTag[]];
}

/**
 * A distinct tag, with optionally specifying column names
 * https://www.postgresql.org/docs/current/sql-select.html
 *
 *                         ┌─column
 *                         ▼
 *        ┌ ─ ─ ─ ─ ─ ┬ ┬────┬ ┬────┬ ┐
 * SELECT  DISTINCT ON (│col1│,│col2│) * FROM table1
 *        └ ─ ─ ─ ─ ─ ┴ ┴────┴ ┴────┴ ┘
 *       └─────────────────────────────┘
 *                      └─▶DistinctTag
 */
export interface DistinctTag extends NodeSqlTag {
  tag: 'Distinct';
  values: ColumnTag[];
}

/**
 * A tag adding a filter to aggregate function
 * https://www.postgresql.org/docs/14/sql-expressions.html
 *
 *                                          ┌─condition
 *                                          ▼
 *                       ─ ─ ─ ┬ ┬─────────────────────┬ ┐
 * SELECT array_agg (id │FILTER (│WHERE visible = TRUE │)  FROM table1
 *                       ─ ─ ─ ┴ ┴─────────────────────┴ ┘
 *                     └──────────────────────────────────┘
 *                                       └─▶FilterTag
 */
export interface FilterTag extends NodeSqlTag {
  tag: 'Filter';
  values: [condition: WhereTag];
}

/**
 * A tag representing "*", e.g.  SELECT * FROM table1
 */
export interface StarTag extends EmptyLeafSqlTag {
  tag: 'Star';
}

/**
 * A tag reprsenting a qualified "*", e.g. `public.table1.*`
 * https://www.postgresql.org/docs/current/sql-expressions.html#FIELD-SELECTION
 *
 *          ┌─schema ┌─table ┌─ star
 *          ▼        ▼       ▼
 *        ┌──────┬ ┬──────┬ ┬─┐
 * SELECT │public│.│table1│.│*│ FROM table1
 *        └──────┴ ┴──────┴ ┴─┘
 *       └─────────────────────┘
 *                  └─▶StarIdentifierTag
 */
export interface StarIdentifierTag extends NodeSqlTag {
  tag: 'StarIdentifier';
  values:
    | [schema: IdentifierTag, table: IdentifierTag, star: StarTag]
    | [table: IdentifierTag, star: StarTag]
    | [star: StarTag];
}

/**
 * A tag representing a row constructor
 * https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-ROW-CONSTRUCTORS
 *
 *                ┌─expression
 *                ▼
 *         ┌ ─ ┬ ┬─┬ ┬───┬ ┬──────┬ ┐
 *  SELECT  ROW (│1│,│2.5│,│'test'│)
 *         └ ─ ┴ ┴─┴ ┴───┴ ┴──────┴ ┘
 *        └──────────────────────────┘
 *                     └▶RowTag
 */
export interface RowTag extends NodeSqlTag {
  tag: 'Row';
  values: ExpressionTag[];
}

/**
 * A tag for "when" in a case conditional.
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 *
 *                    ┌── when  ┌── then
 *                    ▼         ▼
 *             ┌ ─ ─┌───┬ ─ ─┌─────┐
 * SELECT CASE  WHEN│a=1│THEN│'one'│ WHEN a=2 THEN 'two' ELSE 'other' END FROM table1
 *             └ ─ ─└───┴ ─ ─└─────┘
 *            └─────────────────────┘
 *                       └─▶WhenTag
 */
export interface WhenTag extends NodeSqlTag {
  tag: 'When';
  values: [when: ExpressionTag, then: ExpressionTag];
}

/**
 * A tag for "else" in a case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 *
 *                                                     ┌ ─ ─┌───────┐
 *  SELECT CASE WHEN a=1 THEN 'one' WHEN a=2 THEN 'two' ELSE│'other'│ END FROM table1
 *                                                     └ ─ ─└───────┘
 *                                                    └──────────────┘
 *                                                           └─▶ElseTag
 */
export interface ElseTag extends NodeSqlTag {
  tag: 'Else';
  values: [ExpressionTag];
}

/**
 * A simple case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 *
 *              ┌─▶value  ┌─▶option         ┌─▶option       ┌─▶option
 *        ┌ ─ ─┌─┬─────────────────┬─────────────────┬────────────┬ ─ ┐
 * SELECT  CASE│a│WHEN 1 THEN 'one'│WHEN 2 THEN 'two'│ELSE 'other'│END FROM table1
 *        └ ─ ─└─┴─────────────────┴─────────────────┴────────────┴ ─ ┘
 *       └─────────────────────────────────────────────────────────────┘
 *                                      └─▶CaseSimpleTag
 */
export interface CaseSimpleTag extends NodeSqlTag {
  tag: 'CaseSimple';
  values: [value: CastableDataTypeTag, ...options: (WhenTag | ElseTag)[]];
}

/**
 * A normal case conditional
 * https://www.postgresql.org/docs/current/functions-conditional.html#FUNCTIONS-CASE
 *
 *                      ┌─▶option           ┌─▶option        ┌─▶option
 *       ┌ ─ ─┌───────────────────┬───────────────────┬────────────┬ ─ ┐
 * SELECT CASE│WHEN a=1 THEN 'one'│WHEN a=2 THEN 'two'│ELSE 'other'│END FROM table1
 *       └ ─ ─└───────────────────┴───────────────────┴────────────┴ ─ ┘
 *      └───────────────────────────────────────────────────────────────┘
 *                                    └─▶CaseTag
 */
export interface CaseTag extends NodeSqlTag {
  tag: 'Case';
  values: (WhenTag | ElseTag)[];
}

/**
 * The operator of a binary expression, e.g. 1 + 2
 */
export interface BinaryOperatorTag extends LeafSqlTag {
  tag: 'BinaryOperator';
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
  tag: 'UnaryOperator';
  value: '+' | '-' | 'NOT' | 'ISNULL' | 'NOTNULL';
}

/**
 * THe operator of a row and array comparations
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 */
export interface ComparationOperatorTag extends LeafSqlTag {
  tag: 'ComparationOperator';
  value: '<=' | '>=' | '<' | '>' | '<>' | '!=' | '=' | 'AND' | 'OR';
}

/**
 * The type of a row and array comparation
 * https://www.postgresql.org/docs/current/functions-comparisons.html
 */
export interface ComparationTypeTag extends LeafSqlTag {
  tag: 'ComparationType';
  value: 'IN' | 'NOT IN' | 'ANY' | 'SOME' | 'ALL' | 'EXISTS';
}

/**
 * A binary expression, e.g. 1 + 2
 * If changed (1 + 2 + 2), one of the operands will be a binary expression itself.
 * Depending on the precedence order
 * https://www.postgresql.org/docs/current/typeconv-oper.html
 *
 *         ┌─left
 *         │  ┌─operator
 *         │  │   ┌─right
 *         ▼  ▼   ▼
 *       ┌───┬─┬─────┐
 * SELECT│113│+│4 + 2│
 *       └───┴─┴─────┘
 *      └─────────────┘
 *             └▶BinaryExpressionTag
 */
export interface BinaryExpressionTag extends NodeSqlTag {
  tag: 'BinaryExpression';
  values: [
    left: DataTypeTag | OperatorExpressionTag,
    operator: BinaryOperatorTag,
    right: DataTypeTag | OperatorExpressionTag,
  ];
}

/**
 * An unary expression e.g. -32
 * https://www.postgresql.org/docs/current/typeconv-oper.html
 *
 *        ┌─operator
 *        │  ┌──value
 *        ▼  ▼
 *       ┌─┬───┐
 * SELECT│-│123│
 *       └─┴───┘
 *      └───────┘
 *          └─▶UnaryExpressionTag
 */
export interface UnaryExpressionTag extends NodeSqlTag {
  tag: 'UnaryExpression';
  values: [operator: UnaryOperatorTag, value: DataTypeTag | OperatorExpressionTag];
}

/**
 * Ternary operators (operators with 3 arguments). e.g. a BETWEEN 2 AND 3
 */
export interface TernaryOperatorTag extends LeafSqlTag {
  tag: 'TernaryOperator';
  value: 'BETWEEN' | 'NOT BETWEEN' | 'BETWEEN SYMMETRIC' | 'NOT BETWEEN SYMMETRIC';
}

/**
 * Ternary operators (operators with 3 arguments) separator. e.g. the second operator of a ternary.
 */
export interface TernarySeparatorTag extends LeafSqlTag {
  tag: 'TernarySeparator';
  value: 'AND';
}

/**
 * Ternary expression (with 2 operatrs and 3 arguments).
 * https://www.postgresql.org/docs/current/functions-comparison.html
 *
 *         ┌─────value
 *         │     ┌──operator
 *         │     │     ┌──arg1
 *         │     │     │  ┌──separator
 *         │     │     │  │   ┌──arg2
 *         ▼     ▼     ▼  ▼   ▼
 *       ┌───┬───────┬──┬───┬──┐
 * SELECT│col│BETWEEN│12│AND│25│ROM table1
 *       └───┴───────┴──┴───┴──┘
 *      └───────────────────────┘
 *                  └─▶TernaryExpressionTag
 */
export interface TernaryExpressionTag extends NodeSqlTag {
  tag: 'TernaryExpression';
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
 *
 *                 ┌─data
 *                 │        ┌─type
 *                 ▼        ▼
 *       ┌ ─ ─┌ ┬─────┬ ─┌─────┬ ┐
 * SELECT CAST│(│'3.5'│AS│float│)
 *       └ ─ ─└ ┴─────┴ ─└─────┴ ┘
 *      └─────────────────────────┘
 *                   └▶CastTag
 */
export interface CastTag extends NodeSqlTag {
  tag: 'Cast';
  values: [data: DataTypeTag, type: AnyTypeTag];
}

/**
 * A postgres style cast with "::"
 * https://www.postgresql.org/docs/14/sql-expressions.html#SQL-SYNTAX-TYPE-CASTS
 *
 *          ┌─data
 *          │        ┌─type
 *          ▼        ▼
 *       ┌─────┬ ─┌─────┐
 * SELECT│'3.5'│::│float│
 *       └─────┴ ─└─────┘
 *      └────────────────┘
 *               │
 *               └──▶PgCastTag
 */
export interface PgCastTag extends NodeSqlTag {
  tag: 'PgCast';
  values: [data: DataTypeTag, type: AnyTypeTag];
}
export interface ArrayConstructorTag extends NodeSqlTag {
  tag: 'ArrayConstructor';
  values: ExpressionTag[];
}
export interface FunctionTag extends NodeSqlTag {
  tag: 'Function';
  values: [IdentifierTag, ...(ExpressionTag | OrderByTag | DistinctTag | FilterTag)[]];
}
export interface ComparationExpressionTag extends NodeSqlTag {
  tag: 'ComparationExpression';
  values:
    | [type: ComparationTypeTag, subject: SelectTag]
    | [column: ColumnTag, type: ComparationTypeTag, subject: SelectTag]
    | [
        column: ColumnTag,
        operator: ComparationOperatorTag,
        type: ComparationTypeTag,
        subject: SelectTag | ArrayConstructorTag | ExpressionListTag,
      ]
    | [column: ColumnTag, operator: ComparationOperatorTag, subject: SelectTag];
}
export interface SelectListItemTag extends NodeSqlTag {
  tag: 'SelectListItem';
  values: [value: StarIdentifierTag | ExpressionTag] | [value: ExpressionTag, as: AsTag];
}
export interface SelectListTag extends NodeSqlTag {
  tag: 'SelectList';
  values: SelectListItemTag[];
}
export interface NamedSelectTag extends NodeSqlTag {
  tag: 'NamedSelect';
  values: [select: SelectTag, as: AsTag];
}
export interface JoinTypeTag extends LeafSqlTag {
  tag: 'JoinType';
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
export interface JoinOnTag extends NodeSqlTag {
  tag: 'JoinOn';
  values: [ExpressionTag];
}
export interface JoinUsingTag extends NodeSqlTag {
  tag: 'JoinUsing';
  values: ColumnTag[];
}
export interface JoinTag extends NodeSqlTag {
  tag: 'Join';
  values:
    | [type: JoinTypeTag, table: TableTag]
    | [type: JoinTypeTag, table: TableTag, condition: JoinOnTag | JoinUsingTag];
}
export interface FromListTag extends NodeSqlTag {
  tag: 'FromList';
  values: FromListItemTag[];
}
export interface FromTag extends NodeSqlTag {
  tag: 'From';
  values: [list: FromListTag, ...join: JoinTag[]];
}
export interface WhereTag extends NodeSqlTag {
  tag: 'Where';
  values: [ExpressionTag];
}
export interface GroupByTag extends NodeSqlTag {
  tag: 'GroupBy';
  values: ColumnTag[];
}
export interface HavingTag extends NodeSqlTag {
  tag: 'Having';
  values: [ExpressionTag];
}
export interface CombinationType extends LeafSqlTag {
  tag: 'CombinationType';
  value: 'UNION' | 'INTERSECT' | 'EXCEPT';
}
export interface CombinationTag extends NodeSqlTag {
  tag: 'Combination';
  values: [CombinationType, ...SelectParts[]];
}
export interface OrderDirectionTag extends LeafSqlTag {
  tag: 'OrderDirection';
  value: 'ASC' | 'DESC' | 'USNIG >' | 'USING <';
}
export interface OrderByItemTag extends NodeSqlTag {
  tag: 'OrderByItem';
  values: [order: ExpressionTag] | [order: ExpressionTag, direction: OrderDirectionTag];
}
export interface OrderByTag extends NodeSqlTag {
  tag: 'OrderBy';
  values: OrderByItemTag[];
}
export interface LimitTag extends NodeSqlTag {
  tag: 'Limit';
  values: [CountTag | LimitAllTag];
}
export interface LimitAllTag extends EmptyLeafSqlTag {
  tag: 'LimitAll';
}
export interface OffsetTag extends NodeSqlTag {
  tag: 'Offset';
  values: [CountTag];
}
export interface SelectTag extends NodeSqlTag {
  tag: 'Select';
  values: (SelectParts | OrderByTag | CombinationTag | LimitTag | OffsetTag)[];
}
export interface DefaultTag extends EmptyLeafSqlTag {
  tag: 'Default';
}
export interface SetItemTag extends NodeSqlTag {
  tag: 'SetItem';
  values: [column: IdentifierTag, value: ExpressionTag | DefaultTag];
}
export interface SetListTag extends NodeSqlTag {
  tag: 'SetList';
  values: SetItemTag[];
}
export interface ColumnsTag extends NodeSqlTag {
  tag: 'Columns';
  values: IdentifierTag[];
}
export interface ValuesTag extends NodeSqlTag {
  tag: 'Values';
  values: (ExpressionTag | DefaultTag)[];
}
export interface SetMapTag extends NodeSqlTag {
  tag: 'SetMap';
  values: [columns: ColumnsTag, values: ValuesTag | SelectTag];
}
export interface SetTag extends NodeSqlTag {
  tag: 'Set';
  values: [SetListTag | SetMapTag];
}
export interface TableIdentifierTag extends NodeSqlTag {
  tag: 'TableIdentifier';
  values: [schema: IdentifierTag, table: IdentifierTag] | [table: IdentifierTag];
}
export interface TableTag extends NodeSqlTag {
  tag: 'Table';
  values: [table: TableIdentifierTag] | [table: TableIdentifierTag, as: AsTag];
}
export interface UpdateFromTag extends NodeSqlTag {
  tag: 'UpdateFrom';
  values: FromListItemTag[];
}
export interface ReturningListItemTag extends NodeSqlTag {
  tag: 'ReturningListItem';
  values: [value: StarIdentifierTag | ExpressionTag] | [value: ExpressionTag, as: AsTag];
}
export interface ReturningTag extends NodeSqlTag {
  tag: 'Returning';
  values: ReturningListItemTag[];
}
export interface UpdateTag extends NodeSqlTag {
  tag: 'Update';
  values: (SetTag | TableTag | UpdateFromTag | WhereTag | ReturningTag)[];
}

export interface UsingTag extends NodeSqlTag {
  tag: 'Using';
  values: FromListItemTag[];
}
export interface DeleteTag extends NodeSqlTag {
  tag: 'Delete';
  values: (TableTag | UsingTag | WhereTag | ReturningTag)[];
}

export interface ValuesListTag extends NodeSqlTag {
  tag: 'ValuesList';
  values: (ParameterTag | ValuesTag)[];
}
export interface CollateTag extends LeafSqlTag {
  tag: 'Collate';
  value: string;
}
export interface ConflictTargetTag extends NodeSqlTag {
  tag: 'ConflictTarget';
  values: (TableTag | ExpressionTag | CollateTag | WhereTag)[];
}
export interface ConflictConstraintTag extends LeafSqlTag {
  tag: 'ConflictConstraint';
  value: string;
}
export interface DoNothingTag extends LeafSqlTag {
  tag: 'DoNothing';
}
export interface DoUpdateTag extends NodeSqlTag {
  tag: 'DoUpdate';
  values: [set: SetTag] | [set: SetTag, where: WhereTag];
}
export interface ConflictTag extends NodeSqlTag {
  tag: 'Conflict';
  values: (ConflictTargetTag | ConflictConstraintTag | DoNothingTag | DoUpdateTag)[];
}
export interface InsertTag extends NodeSqlTag {
  tag: 'Insert';
  values: (TableTag | SelectTag | ValuesListTag | ConflictTag | ColumnsTag | ReturningTag)[];
}
export interface WrappedExpressionTag extends NodeSqlTag {
  tag: 'WrappedExpression';
  values: [ExpressionTag];
}
export interface ExpressionListTag extends NodeSqlTag {
  tag: 'ExpressionList';
  values: ExpressionTag[];
}
export interface BeginTag extends EmptyLeafSqlTag {
  tag: 'Begin';
}
export interface CommitTag extends EmptyLeafSqlTag {
  tag: 'Commit';
}
export interface SavepointTag extends NodeSqlTag {
  tag: 'Savepoint';
  values: [IdentifierTag];
}
export interface RollbackTag extends NodeSqlTag {
  tag: 'Rollback';
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
export type AnyTypeTag = TypeTag | TypeArrayTag;
export type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
export type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
export type AnyCastTag = CastTag | PgCastTag;
export type DataTypeTag = NullTag | CaseTag | CaseSimpleTag | CastableDataTypeTag;
export type QueryTag = SelectTag | UpdateTag | InsertTag | DeleteTag;
export type TransactionTag = BeginTag | CommitTag | SavepointTag | RollbackTag;

export type CastableDataTypeTag =
  | ArrayIndexTag
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
  | ComparationExpressionTag
  | DataTypeTag
  | OperatorExpressionTag
  | RowTag
  | WrappedExpressionTag;

export type EmptyLeafTag =
  | NullTag
  | StarTag
  | DefaultTag
  | DoNothingTag
  | LimitAllTag
  | DimensionTag
  | BeginTag
  | CommitTag;

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
  | ComparationOperatorTag
  | ComparationTypeTag
  | JoinTypeTag
  | OrderDirectionTag
  | CollateTag
  | ConflictConstraintTag
  | CombinationType;

export type NodeTag =
  | SavepointTag
  | RollbackTag
  | ExtractTag
  | TypedConstantTag
  | TypeTag
  | JoinTag
  | CTETag
  | WithTag
  | ColumnTag
  | AsTag
  | ArrayIndexRangeTag
  | ArrayIndexTag
  | CountTag
  | TypeArrayTag
  | DistinctTag
  | FilterTag
  | StarIdentifierTag
  | RowTag
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
  | ComparationExpressionTag
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
  | TableIdentifierTag
  | TableTag
  | UpdateFromTag
  | ReturningListItemTag
  | ReturningTag
  | UpdateTag
  | UsingTag
  | DeleteTag
  | ValuesListTag
  | ConflictTargetTag
  | DoUpdateTag
  | ConflictTag
  | InsertTag
  | WrappedExpressionTag
  | ExpressionListTag;

export type Tag = EmptyLeafTag | LeafTag | NodeTag;

export type AstTag = QueryTag | WithTag | TransactionTag;
