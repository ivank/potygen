export interface SqlTag {
  pos: number;
  nextPos: number;
  tag: string;
}

export interface EmptyLeafSqlTag extends SqlTag {}

export interface LeafSqlTag extends SqlTag {
  value: string;
}

export interface NodeSqlTag extends SqlTag {
  values: Tag[];
}

export interface CTETag extends NodeSqlTag {
  tag: 'CTE';
  values: [name: IdentifierTag, query: QueryTag];
}

export interface WithTag extends NodeSqlTag {
  tag: 'With';
  values: [...cte: CTETag[], query: QueryTag];
}

export interface NullTag extends EmptyLeafSqlTag {
  tag: 'Null';
}
export interface QuotedNameTag extends LeafSqlTag {
  tag: 'QuotedName';
  value: string;
}
export interface IdentifierTag extends LeafSqlTag {
  tag: 'Identifier';
  value: string;
}
export interface NameTag extends LeafSqlTag {
  tag: 'Name';
  value: string;
}
export interface ParameterTag extends LeafSqlTag {
  tag: 'Parameter';
  type: 'spread' | 'single';
  value: string;
  required: boolean;
  pick: NameTag[];
}
export interface ColumnTag extends NodeSqlTag {
  tag: 'Column';
  values:
    | [schema: IdentifierTag, table: IdentifierTag, name: IdentifierTag]
    | [table: IdentifierTag, name: IdentifierTag]
    | [name: IdentifierTag];
}
export interface AsTag extends NodeSqlTag {
  tag: 'As';
  values: [IdentifierTag];
}
export interface StringTag extends LeafSqlTag {
  tag: 'String';
  value: string;
}
export interface BinaryStringTag extends LeafSqlTag {
  tag: 'BinaryString';
  value: string;
}
export interface NumberTag extends LeafSqlTag {
  tag: 'Number';
  value: string;
}
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
export interface TypedConstantTag extends NodeSqlTag {
  tag: 'TypedConstant';
  values: [type: ConstantTypeTag, value: StringTag];
}
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
export interface ExtractTag extends NodeSqlTag {
  tag: 'Extract';
  values: [field: ExtractFieldTag, value: ExpressionTag];
}
export interface IntegerTag extends LeafSqlTag {
  tag: 'Integer';
  value: string;
}
export interface BooleanTag extends LeafSqlTag {
  tag: 'Boolean';
  value: string;
}
export interface ArrayIndexRangeTag extends NodeSqlTag {
  tag: 'ArrayIndexRange';
  values: [from: ExpressionTag, to: ExpressionTag];
}
export interface ArrayIndexTag extends NodeSqlTag {
  tag: 'ArrayIndex';
  values: [array: ExpressionTag, index: ExpressionTag | ArrayIndexRangeTag];
}
export interface CountTag extends NodeSqlTag {
  tag: 'Count';
  values: [ParameterTag | IntegerTag];
}
export interface DimensionTag extends EmptyLeafSqlTag {
  tag: 'Dimension';
}
export interface TypeTag extends NodeSqlTag {
  tag: 'Type';
  values: [IdentifierTag] | [IdentifierTag, IntegerTag] | [IdentifierTag, IntegerTag, IntegerTag];
}
export interface TypeArrayTag extends NodeSqlTag {
  tag: 'TypeArray';
  values: [TypeTag, ...DimensionTag[]];
}
export interface DistinctTag extends NodeSqlTag {
  tag: 'Distinct';
  values: ColumnTag[];
}
export interface FilterTag extends NodeSqlTag {
  tag: 'Filter';
  values: [WhereTag];
}
export interface StarTag extends EmptyLeafSqlTag {
  tag: 'Star';
}
export interface StarIdentifierTag extends NodeSqlTag {
  tag: 'StarIdentifier';
  values:
    | [schema: IdentifierTag, table: IdentifierTag, star: StarTag]
    | [table: IdentifierTag, star: StarTag]
    | [star: StarTag];
}
export interface RowTag extends NodeSqlTag {
  tag: 'Row';
  values: ExpressionTag[];
}
export interface WhenTag extends NodeSqlTag {
  tag: 'When';
  values: [when: ExpressionTag, then: ExpressionTag];
}
export interface ElseTag extends NodeSqlTag {
  tag: 'Else';
  values: [ExpressionTag];
}
export interface CaseSimpleTag extends NodeSqlTag {
  tag: 'CaseSimple';
  values: [CastableDataTypeTag, ...(WhenTag | ElseTag)[]];
}
export interface CaseTag extends NodeSqlTag {
  tag: 'Case';
  values: (WhenTag | ElseTag)[];
}
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
export interface UnaryOperatorTag extends LeafSqlTag {
  tag: 'UnaryOperator';
  value: '+' | '-' | 'NOT' | 'ISNULL' | 'NOTNULL';
}
export interface ComparationOperatorTag extends LeafSqlTag {
  tag: 'ComparationOperator';
  value: '<=' | '>=' | '<' | '>' | '<>' | '!=' | '=' | 'AND' | 'OR';
}
export interface ComparationTypeTag extends LeafSqlTag {
  tag: 'ComparationType';
  value: 'IN' | 'NOT IN' | 'ANY' | 'SOME' | 'ALL' | 'EXISTS';
}
export interface BinaryExpressionTag extends NodeSqlTag {
  tag: 'BinaryExpression';
  values: [
    left: DataTypeTag | OperatorExpressionTag,
    operator: BinaryOperatorTag,
    right: DataTypeTag | OperatorExpressionTag,
  ];
}
export interface UnaryExpressionTag extends NodeSqlTag {
  tag: 'UnaryExpression';
  values: [operator: UnaryOperatorTag, value: DataTypeTag | OperatorExpressionTag];
}
export interface TernaryOperatorTag extends LeafSqlTag {
  tag: 'TernaryOperator';
  value: 'BETWEEN' | 'NOT BETWEEN' | 'BETWEEN SYMMETRIC' | 'NOT BETWEEN SYMMETRIC';
}
export interface TernarySeparatorTag extends LeafSqlTag {
  tag: 'TernarySeparator';
  value: 'AND';
}
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
export interface CastTag extends NodeSqlTag {
  tag: 'Cast';
  values: [data: DataTypeTag, type: AnyTypeTag];
}
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

export type FromListItemTag = NamedSelectTag | TableTag;
export type ConstantTag = StringTag | NumberTag | BooleanTag | TypedConstantTag;
export type AnyTypeTag = TypeTag | TypeArrayTag;
export type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
export type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
export type AnyCastTag = CastTag | PgCastTag;
export type DataTypeTag = NullTag | CaseTag | CaseSimpleTag | CastableDataTypeTag;
export type QueryTag = SelectTag | UpdateTag | InsertTag | DeleteTag;

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

export type EmptyLeafTag = NullTag | StarTag | DefaultTag | DoNothingTag | LimitAllTag | DimensionTag;

export type LeafTag =
  | ExtractFieldTag
  | BinaryStringTag
  | ConstantTypeTag
  | TernaryOperatorTag
  | TernarySeparatorTag
  | QuotedNameTag
  | IdentifierTag
  | NameTag
  | ParameterTag
  | StringTag
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

export type AstTag = QueryTag | WithTag;
