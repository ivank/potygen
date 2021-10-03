export interface SqlTag {
  pos: number;
  lastPos: number;
  tag: string;
}

export interface NullTag extends SqlTag {
  tag: 'Null';
}
export interface QuotedNameTag extends SqlTag {
  tag: 'QuotedName';
  value: string;
}
export interface IdentifierTag extends SqlTag {
  tag: 'Identifier';
  value: string;
}
export interface ParameterTag extends SqlTag {
  tag: 'Parameter';
  type: 'spread' | 'single';
  value: string;
  required: boolean;
  pick: IdentifierTag[];
  lastPos: number;
}
export interface QualifiedIdentifierTag extends SqlTag {
  tag: 'QualifiedIdentifier';
  values: IdentifierTag[];
}
export interface AsTag extends SqlTag {
  tag: 'As';
  value: IdentifierTag;
}
export interface StringTag extends SqlTag {
  tag: 'String';
  value: string;
}
export interface NumberTag extends SqlTag {
  tag: 'Number';
  value: string;
}
export interface BooleanTag extends SqlTag {
  tag: 'Boolean';
  value: string;
}
export interface ArrayIndexRangeTag extends SqlTag {
  tag: 'ArrayIndexRange';
  left: ExpressionTag;
  right: ExpressionTag;
}
export interface ArrayIndexTag extends SqlTag {
  tag: 'ArrayIndex';
  value: ExpressionTag;
  index: ExpressionTag | ArrayIndexRangeTag;
}
export interface CountTag extends SqlTag {
  tag: 'Count';
  value: string | ParameterTag;
}
export interface TypeTag extends SqlTag {
  tag: 'Type';
  value: string;
  param?: string;
}
export interface TypeArrayTag extends SqlTag {
  tag: 'TypeArray';
  value: TypeTag;
  dimensions: number;
}
export interface DistinctTag extends SqlTag {
  tag: 'Distinct';
  values: IdentifierTag[];
}
export interface StarIdentifierTag extends SqlTag {
  tag: 'StarIdentifier';
}
export interface StarQualifiedIdentifierTag extends SqlTag {
  tag: 'StarQualifiedIdentifier';
  values: (IdentifierTag | StarIdentifierTag)[];
}
export interface RowTag extends SqlTag {
  tag: 'Row';
  values: ExpressionTag[];
}
export interface NativePgCastTag extends SqlTag {
  tag: 'PgCast';
  value: ConstantTag | QualifiedIdentifierTag | ExpressionTag | ParameterTag;
  type: AnyTypeTag;
}

export interface WhenTag extends SqlTag {
  tag: 'When';
  condition: ExpressionTag;
  value: ExpressionTag;
}
export interface ElseTag extends SqlTag {
  tag: 'Else';
  value: ExpressionTag;
}
export interface CaseTag extends SqlTag {
  tag: 'Case';
  expression?: CastableDataTypeTag;
  values: (WhenTag | ElseTag)[];
}
export interface NullIfTag extends SqlTag {
  tag: 'NullIfTag';
  value: ExpressionTag;
  conditional: ExpressionTag;
}
export interface ConditionalExpressionTag extends SqlTag {
  tag: 'ConditionalExpression';
  type: 'GREATEST' | 'LEAST' | 'COALESCE';
  values: ExpressionTag[];
}
export interface OperatorTag extends SqlTag {
  tag: 'Operator';
  value: string;
}
export interface BinaryExpressionTag extends SqlTag {
  tag: 'BinaryExpression';
  left: DataTypeTag | OperatorExpressionTag;
  right: DataTypeTag | OperatorExpressionTag;
  operator: OperatorTag;
}
export interface UnaryExpressionTag extends SqlTag {
  tag: 'UnaryExpression';
  value: DataTypeTag | OperatorExpressionTag;
  operator: OperatorTag;
}
export interface BetweenTag extends SqlTag {
  tag: 'Between';
  left: DataTypeTag;
  right: DataTypeTag;
  value: DataTypeTag;
}
export interface CastTag extends SqlTag {
  tag: 'Cast';
  value: DataTypeTag;
  type: AnyTypeTag;
}
export interface PgCastTag extends SqlTag {
  tag: 'PgCast';
  value: DataTypeTag;
  type: AnyTypeTag;
}
export interface ArrayConstructorTag extends SqlTag {
  tag: 'ArrayConstructor';
  values: ExpressionTag[];
}
export interface FunctionTag extends SqlTag {
  tag: 'Function';
  value: IdentifierTag;
  args: (ExpressionTag | OrderByTag)[];
}
export interface SubqueryExpressionTag extends SqlTag {
  tag: 'SubqueryExpression';
  operator?: OperatorTag;
  type?: 'IN' | 'NOT IN' | 'ANY' | 'SOME' | 'ALL' | 'EXISTS';
  value?: QualifiedIdentifierTag;
  subquery: SelectTag;
}
export interface SelectListItemTag extends SqlTag {
  tag: 'SelectListItem';
  value: ExpressionTag | StarQualifiedIdentifierTag;
  as?: AsTag;
}
export interface SelectListTag extends SqlTag {
  tag: 'SelectList';
  values: SelectListItemTag[];
}
export interface FromListItemTag extends SqlTag {
  tag: 'FromListItem';
  value: QualifiedIdentifierTag | ExpressionTag | SelectTag;
  as?: AsTag;
}
export interface JoinTypeTag extends SqlTag {
  tag: 'JoinType';
  value: 'LEFT' | 'RIGHT' | 'OUTER' | 'CROSS';
}
export interface JoinOnTag extends SqlTag {
  tag: 'JoinOn';
  value: ExpressionTag;
}
export interface JoinUsingTag extends SqlTag {
  tag: 'JoinUsing';
  values: QualifiedIdentifierTag[];
}
export interface JoinTag extends SqlTag {
  tag: 'Join';
  type: JoinTypeTag;
  table: QualifiedIdentifierTag;
  values: (AsTag | JoinOnTag | JoinUsingTag)[];
}
export interface FromListTag extends SqlTag {
  tag: 'FromList';
  values: FromListItemTag[];
}
export interface FromTag extends SqlTag {
  tag: 'From';
  list: FromListTag;
  join: JoinTag[];
}
export interface WhereTag extends SqlTag {
  tag: 'Where';
  value: ExpressionTag;
}
export interface GroupByTag extends SqlTag {
  tag: 'GroupBy';
  values: QualifiedIdentifierTag[];
}
export interface HavingTag extends SqlTag {
  tag: 'Having';
  value: ExpressionTag;
}
export interface CombinationTag extends SqlTag {
  tag: 'Combination';
  type: 'UNION' | 'INTERSECT' | 'EXCEPT';
  values: SelectParts[];
}
export interface OrderDirectionTag extends SqlTag {
  tag: 'OrderDirection';
  value: 'ASC' | 'DESC' | 'USNIG >' | 'USING <';
}
export interface OrderByItemTag extends SqlTag {
  tag: 'OrderByItem';
  value: ExpressionTag;
  direction: OrderDirectionTag;
}
export interface OrderByTag extends SqlTag {
  tag: 'OrderBy';
  values: OrderByItemTag[];
}
export interface LimitTag extends SqlTag {
  tag: 'Limit';
  value: CountTag;
}
export interface OffsetTag extends SqlTag {
  tag: 'Offset';
  value: CountTag;
}
export interface SelectTag extends SqlTag {
  tag: 'Select';
  values: (SelectParts | OrderByTag | CombinationTag | LimitTag | OffsetTag)[];
}

export interface DefaultTag extends SqlTag {
  tag: 'Default';
}
export interface SetItemTag extends SqlTag {
  tag: 'SetItem';
  column: QualifiedIdentifierTag;
  value: ExpressionTag | DefaultTag;
}
export interface SetListTag extends SqlTag {
  tag: 'SetList';
  values: SetItemTag[];
}
export interface ColumnsTag extends SqlTag {
  tag: 'Columns';
  values: IdentifierTag[];
}
export interface ValuesTag extends SqlTag {
  tag: 'Values';
  values: (ExpressionTag | DefaultTag)[];
}
export interface SetMapTag extends SqlTag {
  tag: 'SetMap';
  columns: ColumnsTag;
  values: ValuesTag | SelectTag;
}
export interface SetTag extends SqlTag {
  tag: 'Set';
  value: SetListTag | SetMapTag;
}
export interface TableTag extends SqlTag {
  tag: 'Table';
  value: QualifiedIdentifierTag;
  as?: AsTag;
}
export interface UpdateFromTag extends SqlTag {
  tag: 'UpdateFrom';
  values: FromListItemTag[];
}
export interface ReturningListItemTag extends SqlTag {
  tag: 'ReturningListItem';
  value: ExpressionTag | StarQualifiedIdentifierTag;
  as?: AsTag;
}
export interface ReturningTag extends SqlTag {
  tag: 'Returning';
  values: ReturningListItemTag[];
}
export interface UpdateTag extends SqlTag {
  tag: 'Update';
  values: (SetTag | TableTag | UpdateFromTag | WhereTag | ReturningTag)[];
}

export interface UsingTag extends SqlTag {
  tag: 'Using';
  values: FromListItemTag[];
}
export interface DeleteTag extends SqlTag {
  tag: 'Delete';
  values: (TableTag | UsingTag | WhereTag | ReturningTag)[];
}

export interface ValuesListTag extends SqlTag {
  tag: 'ValuesList';
  values: (ParameterTag | ValuesTag)[];
}
export interface CollateTag extends SqlTag {
  tag: 'Collate';
  value: string;
}
export interface ConflictTargetTag extends SqlTag {
  tag: 'ConflictTarget';
  values: (TableTag | ExpressionTag | CollateTag | WhereTag)[];
}
export interface ConflictConstraintTag extends SqlTag {
  tag: 'ConflictConstraint';
  value: string;
}
export interface DoNothingTag extends SqlTag {
  tag: 'DoNothing';
}
export interface DoUpdateTag extends SqlTag {
  tag: 'DoUpdate';
  value: SetTag;
  where: WhereTag;
}
export interface ConflictTag extends SqlTag {
  tag: 'Conflict';
  values: (ConflictTargetTag | ConflictConstraintTag | DoNothingTag | DoUpdateTag)[];
}
export interface InsertTag extends SqlTag {
  tag: 'Insert';
  values: (TableTag | SelectTag | ValuesListTag | ConflictTag | ColumnsTag | ReturningTag)[];
}

type ConstantTag = NullTag | StringTag | NumberTag | BooleanTag;
type AnyTypeTag = TypeTag | TypeArrayTag;
type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
type AnyCastTag = CastTag | PgCastTag;
type DataTypeTag = CaseTag | CastableDataTypeTag;

export type CastableDataTypeTag =
  | FunctionTag
  | ArrayIndexTag
  | ConstantTag
  | QualifiedIdentifierTag
  | SelectTag
  | ParameterTag
  | NativePgCastTag;

export type ExpressionTag =
  | AnyCastTag
  | DataTypeTag
  | OperatorExpressionTag
  | BetweenTag
  | DataTypeTag
  | RowTag
  | SubqueryExpressionTag
  | NullIfTag
  | ConditionalExpressionTag;

export type Tag =
  | NullTag
  | IdentifierTag
  | ParameterTag
  | QualifiedIdentifierTag
  | AsTag
  | StringTag
  | NumberTag
  | BooleanTag
  | ConstantTag
  | CountTag
  | ArrayIndexRangeTag
  | ArrayIndexTag
  | TypeTag
  | TypeArrayTag
  | DistinctTag
  | StarIdentifierTag
  | StarQualifiedIdentifierTag
  | CastableDataTypeTag
  | WhenTag
  | ElseTag
  | CaseTag
  | DataTypeTag
  | OperatorTag
  | BinaryExpressionTag
  | BetweenTag
  | CastTag
  | PgCastTag
  | ExpressionTag
  | SelectListItemTag
  | SelectListTag
  | FromListItemTag
  | FromTag
  | FromListTag
  | JoinTypeTag
  | JoinOnTag
  | JoinUsingTag
  | JoinTag
  | WhereTag
  | GroupByTag
  | HavingTag
  | CombinationTag
  | OrderDirectionTag
  | OrderByItemTag
  | OrderByTag
  | LimitTag
  | OffsetTag
  | SelectTag
  | DefaultTag
  | SetItemTag
  | SetListTag
  | ColumnsTag
  | ValuesTag
  | SetMapTag
  | SetTag
  | TableTag
  | UpdateFromTag
  | ReturningTag
  | ReturningListItemTag
  | UpdateTag
  | UsingTag
  | DeleteTag
  | ValuesListTag
  | InsertTag
  | QuotedNameTag
  | CollateTag
  | ConflictTargetTag
  | ConflictConstraintTag
  | DoNothingTag
  | DoUpdateTag
  | ConflictTag
  | ArrayConstructorTag
  | FunctionTag
  | NullIfTag
  | ConditionalExpressionTag;

export const isNull = (value: SqlTag): value is NullTag => value.tag === 'Null';
export const isPgCast = (value: SqlTag): value is PgCastTag => value.tag === 'PgCast';
export const isIdentifier = (value: SqlTag): value is IdentifierTag => value.tag === 'Identifier';
export const isParameter = (value: SqlTag): value is ParameterTag => value.tag === 'Parameter';
export const isQualifiedIdentifier = (value: SqlTag): value is QualifiedIdentifierTag =>
  value.tag === 'QualifiedIdentifier';
export const isAs = (value: SqlTag): value is AsTag => value.tag === 'As';
export const isString = (value: SqlTag): value is StringTag => value.tag === 'String';
export const isNumber = (value: SqlTag): value is NumberTag => value.tag === 'Number';
export const isBoolean = (value: SqlTag): value is BooleanTag => value.tag === 'Boolean';
export const isConstant = (value: SqlTag): value is ConstantTag => value.tag === 'Constant';
export const isCount = (value: SqlTag): value is CountTag => value.tag === 'Count';
export const isArrayIndexRange = (value: SqlTag): value is ArrayIndexRangeTag => value.tag === 'ArrayIndexRange';
export const isType = (value: SqlTag): value is TypeTag => value.tag === 'Type';
export const isAnyType = (value: SqlTag): value is AnyTypeTag => isType(value) || isTypeArray(value);
export const isTypeArray = (value: SqlTag): value is TypeArrayTag => value.tag === 'TypeArray';
export const isDistinct = (value: SqlTag): value is DistinctTag => value.tag === 'Distinct';
export const isStarIdentifier = (value: SqlTag): value is StarIdentifierTag => value.tag === 'StarIdentifier';
export const isStarQualifiedIdentifier = (value: SqlTag): value is StarQualifiedIdentifierTag =>
  value.tag === 'StarQualifiedIdentifier';
export const isCastableDataType = (value: SqlTag): value is CastableDataTypeTag => value.tag === 'CastableDataType';
export const isWhen = (value: SqlTag): value is WhenTag => value.tag === 'When';
export const isElse = (value: SqlTag): value is ElseTag => value.tag === 'Else';
export const isCase = (value: SqlTag): value is CaseTag => value.tag === 'Case';
export const isNullIf = (value: SqlTag): value is NullIfTag => value.tag === 'NullIf';
export const isConditionalExpression = (value: SqlTag): value is ConditionalExpressionTag =>
  value.tag === 'ConditionalExpression';
export const isDataType = (value: SqlTag): value is DataTypeTag => value.tag === 'DataType';
export const isOperator = (value: SqlTag): value is OperatorTag => value.tag === 'Operator';
export const isBetween = (value: SqlTag): value is BetweenTag => value.tag === 'Between';
export const isArrayIndex = (value: SqlTag): value is ArrayIndexTag => value.tag === 'ArrayIndex';
export const isFunction = (value: SqlTag): value is FunctionTag => value.tag === 'Function';
export const isUnaryExpression = (value: SqlTag): value is UnaryExpressionTag => value.tag === 'UnaryExpression';
export const isBinaryExpression = (value: SqlTag): value is BinaryExpressionTag => value.tag === 'BinaryExpression';
export const isCast = (value: SqlTag): value is CastTag => value.tag === 'Cast';
export const isAnyCast = (value: SqlTag): value is AnyCastTag => isCast(value) || isPgCast(value);
export const isOperatorExpression = (value: SqlTag): value is OperatorExpressionTag =>
  isBinaryExpression(value) || isUnaryExpression(value);
export const isExpression = (value: SqlTag): value is ExpressionTag =>
  isFunction(value) ||
  isArrayIndex(value) ||
  isConstant(value) ||
  isQualifiedIdentifier(value) ||
  isSelect(value) ||
  isParameter(value) ||
  isCast(value) ||
  isPgCast(value) ||
  isOperatorExpression(value) ||
  isBetween(value) ||
  isDataType(value) ||
  isFunction(value) ||
  isArrayIndex(value) ||
  isRow(value) ||
  isSubqueryExpression(value) ||
  isNullIf(value) ||
  isConditionalExpression(value);
export const isSelectListItem = (value: SqlTag): value is SelectListItemTag => value.tag === 'SelectListItem';
export const isReturningListItem = (value: SqlTag): value is ReturningListItemTag => value.tag === 'ReturningListItem';
export const isSelectList = (value: SqlTag): value is SelectListTag => value.tag === 'SelectList';
export const isFromListItem = (value: SqlTag): value is FromListItemTag => value.tag === 'FromListItem';
export const isFrom = (value: SqlTag): value is FromTag => value.tag === 'From';
export const isFromList = (value: SqlTag): value is FromListTag => value.tag === 'FromList';
export const isJoinType = (value: SqlTag): value is JoinTypeTag => value.tag === 'JoinType';
export const isJoinOn = (value: SqlTag): value is JoinOnTag => value.tag === 'JoinOn';
export const isJoinUsing = (value: SqlTag): value is JoinUsingTag => value.tag === 'JoinUsing';
export const isJoin = (value: SqlTag): value is JoinTag => value.tag === 'Join';
export const isWhere = (value: SqlTag): value is WhereTag => value.tag === 'Where';
export const isGroupBy = (value: SqlTag): value is GroupByTag => value.tag === 'GroupBy';
export const isHaving = (value: SqlTag): value is HavingTag => value.tag === 'Having';
export const isCombination = (value: SqlTag): value is CombinationTag => value.tag === 'Combination';
export const isOrderDirection = (value: SqlTag): value is OrderDirectionTag => value.tag === 'OrderDirection';
export const isOrderByItem = (value: SqlTag): value is OrderByItemTag => value.tag === 'OrderByItem';
export const isOrderBy = (value: SqlTag): value is OrderByTag => value.tag === 'OrderBy';
export const isLimit = (value: SqlTag): value is LimitTag => value.tag === 'Limit';
export const isOffset = (value: SqlTag): value is OffsetTag => value.tag === 'Offset';
export const isSelect = (value: SqlTag): value is SelectTag => value.tag === 'Select';
export const isDefault = (value: SqlTag): value is DefaultTag => value.tag === 'Default';
export const isSetItem = (value: SqlTag): value is SetItemTag => value.tag === 'SetItem';
export const isSetList = (value: SqlTag): value is SetListTag => value.tag === 'SetList';
export const isColumns = (value: SqlTag): value is ColumnsTag => value.tag === 'Columns';
export const isValues = (value: SqlTag): value is ValuesTag => value.tag === 'Values';
export const isSetMap = (value: SqlTag): value is SetMapTag => value.tag === 'SetMap';
export const isSet = (value: SqlTag): value is SetTag => value.tag === 'Set';
export const isTable = (value: SqlTag): value is TableTag => value.tag === 'Table';
export const isUpdateFrom = (value: SqlTag): value is UpdateFromTag => value.tag === 'UpdateFrom';
export const isReturning = (value: SqlTag): value is ReturningTag => value.tag === 'Returning';
export const isUpdate = (value: SqlTag): value is UpdateTag => value.tag === 'Update';
export const isUsing = (value: SqlTag): value is UsingTag => value.tag === 'Using';
export const isDelete = (value: SqlTag): value is DeleteTag => value.tag === 'Delete';
export const isValuesList = (value: SqlTag): value is ValuesListTag => value.tag === 'ValuesList';
export const isInsertTag = (value: SqlTag): value is InsertTag => value.tag === 'Insert';
export const isQuotedName = (value: SqlTag): value is InsertTag => value.tag === 'QuotedName';
export const isCollateTag = (value: SqlTag): value is CollateTag => value.tag === 'Collate';
export const isConflictTarget = (value: SqlTag): value is ConflictTargetTag => value.tag === 'ConflictTarget';
export const isConflictConstraint = (value: SqlTag): value is ConflictConstraintTag =>
  value.tag === 'ConflictConstraint';
export const isDoNothing = (value: SqlTag): value is DoNothingTag => value.tag === 'DoNothing';
export const isDoUpdate = (value: SqlTag): value is DoUpdateTag => value.tag === 'DoUpdate';
export const isConflict = (value: SqlTag): value is ConflictTag => value.tag === 'Conflict';
export const isArrayConstructor = (value: SqlTag): value is ArrayConstructorTag => value.tag === 'ArrayConstructor';
export const isRow = (value: SqlTag): value is RowTag => value.tag === 'Row';
export const isSelectTag = (value: SqlTag): value is SelectTag => value.tag === 'Select';
export const isSubqueryExpression = (value: SqlTag): value is SubqueryExpressionTag =>
  value.tag === 'SubqueryExpression';
