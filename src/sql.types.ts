export type NullTag = { tag: 'Null' };
export type QuotedNameTag = { tag: 'QuotedName'; value: string };
export type IdentifierTag = { tag: 'Identifier'; value: string };
export type ParameterTag = { tag: 'Parameter'; value: string; type: 'native' | 'values' };
export type QualifiedIdentifierTag = { tag: 'QualifiedIdentifier'; values: IdentifierTag[] };
export type AsTag = { tag: 'As'; value: IdentifierTag };
export type StringTag = { tag: 'String'; value: string };
export type NumberTag = { tag: 'Number'; value: string };
export type BooleanTag = { tag: 'Boolean'; value: string };
export type ConstantTag = NullTag | StringTag | NumberTag | BooleanTag;
export type ArrayIndexRangeTag = { tag: 'ArrayIndexRange'; left: ExpressionTag; right: ExpressionTag };
export type ArrayIndexTag = { tag: 'ArrayIndex'; value: ExpressionTag; index: ExpressionTag | ArrayIndexRangeTag };
export type CountTag = { tag: 'Count'; value: string | ParameterTag };
export type TypeTag = { tag: 'Type'; value: string; param?: string };
export type TypeArrayTag = { tag: 'TypeArray'; value: TypeTag; dimensions: number };
export type AnyTypeTag = TypeTag | TypeArrayTag;
export type DistinctTag = { tag: 'Distinct'; values: IdentifierTag[] };
export type StarIdentifierTag = { tag: 'StarIdentifier' };
export type StarQualifiedIdentifierTag = {
  tag: 'StarQualifiedIdentifier';
  values: (IdentifierTag | StarIdentifierTag)[];
};
export type RowTag = { tag: 'Row'; values: ExpressionTag[] };
export type CastableDataTypeTag =
  | FunctionTag
  | ArrayIndexTag
  | ConstantTag
  | QualifiedIdentifierTag
  | SelectTag
  | ParameterTag
  | { tag: 'PgCast'; value: ConstantTag | QualifiedIdentifierTag | ExpressionTag | ParameterTag; type: AnyTypeTag };
export type WhenTag = { tag: 'When'; condition: ExpressionTag; value: ExpressionTag };
export type ElseTag = { tag: 'Else'; value: ExpressionTag };
export type CaseTag = { tag: 'Case'; expression?: CastableDataTypeTag; values: (WhenTag | ElseTag)[] };
export type DataTypeTag = CaseTag | CastableDataTypeTag;
export type OperatorTag = { tag: 'Operator'; value: string };
export type BinaryExpressionTag = {
  tag: 'BinaryExpression';
  left: DataTypeTag | OperatorExpressionTag;
  right: DataTypeTag | OperatorExpressionTag;
  operator: OperatorTag;
};
export type UnaryExpressionTag = {
  tag: 'UnaryExpression';
  value: DataTypeTag | OperatorExpressionTag;
  operator: OperatorTag;
};
export type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
export type BetweenTag = { tag: 'Between'; left: DataTypeTag; right: DataTypeTag; value: DataTypeTag };
export type CastTag = { tag: 'Cast'; value: DataTypeTag; type: AnyTypeTag };
export type PgCastTag = { tag: 'PgCast'; value: DataTypeTag; type: AnyTypeTag };
export type AnyCastTag = CastTag | PgCastTag;
export type ArrayConstructorTag = { tag: 'ArrayConstructor'; values: ExpressionTag[] };
export type FunctionTag = { tag: 'Function'; value: IdentifierTag; args: (ExpressionTag | OrderByTag)[] };
export type ExpressionTag = AnyCastTag | DataTypeTag | OperatorExpressionTag | BetweenTag | DataTypeTag | RowTag;
export type SelectListItemTag = {
  tag: 'SelectListItem';
  value: ExpressionTag | StarQualifiedIdentifierTag;
  as?: AsTag;
};
export type SelectListTag = { tag: 'SelectList'; values: SelectListItemTag[] };
export type FromListItemTag = {
  tag: 'FromListItem';
  value: QualifiedIdentifierTag | ExpressionTag | SelectTag;
  as?: AsTag;
};
export type JoinTypeTag = { tag: 'JoinType'; value: 'LEFT' | 'RIGHT' | 'OUTER' | 'CROSS' };
export type JoinOnTag = { tag: 'JoinOn'; value: ExpressionTag };
export type JoinUsingTag = { tag: 'JoinUsing'; values: QualifiedIdentifierTag[] };
export type JoinTag = {
  tag: 'Join';
  type: JoinTypeTag;
  table: QualifiedIdentifierTag;
  values: (AsTag | JoinOnTag | JoinUsingTag)[];
};
export type FromListTag = { tag: 'FromList'; values: FromListItemTag[] };
export type FromTag = { tag: 'From'; list: FromListTag; join: JoinTag[] };
export type WhereTag = { tag: 'Where'; value: ExpressionTag };
export type GroupByTag = { tag: 'GroupBy'; values: QualifiedIdentifierTag[] };
export type HavingTag = { tag: 'Having'; value: ExpressionTag };
type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
export type CombinationTag = { tag: 'Combination'; type: 'UNION' | 'INTERSECT' | 'EXCEPT'; values: SelectParts[] };
export type OrderDirectionTag = { tag: 'OrderDirection'; value: 'ASC' | 'DESC' | 'USNIG >' | 'USING <' };
export type OrderByItemTag = { tag: 'OrderByItem'; value: ExpressionTag; direction: OrderDirectionTag };
export type OrderByTag = { tag: 'OrderBy'; values: OrderByItemTag[] };
export type LimitTag = { tag: 'Limit'; value: CountTag };
export type OffsetTag = { tag: 'Offset'; value: CountTag };
export type SelectTag = { tag: 'Select'; values: (SelectParts | OrderByTag | CombinationTag | LimitTag | OffsetTag)[] };

export type DefaultTag = { tag: 'Default' };
export type SetItemTag = { tag: 'SetItem'; column: QualifiedIdentifierTag; value: ExpressionTag | DefaultTag };
export type SetListTag = { tag: 'SetList'; values: SetItemTag[] };
export type ColumnsTag = { tag: 'Columns'; values: IdentifierTag[] };
export type ValuesTag = { tag: 'Values'; values: (ExpressionTag | DefaultTag)[] };
export type SetMapTag = { tag: 'SetMap'; columns: ColumnsTag; values: ValuesTag | SelectTag };
export type SetTag = { tag: 'Set'; value: SetListTag | SetMapTag };
export type TableTag = { tag: 'Table'; value: QualifiedIdentifierTag; as?: AsTag };
export type UpdateFromTag = { tag: 'UpdateFrom'; values: FromListItemTag[] };
export type ReturningTag = { tag: 'Returning'; values: (QualifiedIdentifierTag | StarIdentifierTag)[] };
export type UpdateTag = { tag: 'Update'; values: (SetTag | TableTag | UpdateFromTag | WhereTag | ReturningTag)[] };

export type UsingTag = { tag: 'Using'; values: FromListItemTag[] };
export type DeleteTag = { tag: 'Delete'; values: (TableTag | UsingTag | WhereTag | ReturningTag)[] };

export type ValuesListTag = { tag: 'ValuesList'; values: ValuesTag[] };
export type CollateTag = { tag: 'Collate'; value: string };
export type ConflictTargetTag = { tag: 'ConflictTarget'; values: (TableTag | ExpressionTag | CollateTag | WhereTag)[] };
export type ConflictConstraintTag = { tag: 'ConflictConstraint'; value: string };
export type DoNothingTag = { tag: 'DoNothing' };
export type DoUpdateTag = { tag: 'DoUpdate'; value: SetTag; where: WhereTag };
export type ConflictTag = {
  tag: 'Conflict';
  values: (ConflictTargetTag | ConflictConstraintTag | DoNothingTag | DoUpdateTag)[];
};
export type InsertTag = { tag: 'Insert'; values: (TableTag | SelectTag | ValuesListTag | ConflictTag)[] };

export type SqlTag = { tag: string };

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
  | FunctionTag;

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
  isArrayIndex(value);
export const isSelectListItem = (value: SqlTag): value is SelectListItemTag => value.tag === 'SelectListItem';
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
export const isValuesListTag = (value: SqlTag): value is ValuesListTag => value.tag === 'ValuesList';
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
