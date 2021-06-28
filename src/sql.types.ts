export type NullTag = { tag: 'Null' };
export type IdentifierTag = { tag: 'Identifier'; value: string };
export type ParameterTag = { tag: 'Parameter'; value: string; type: 'native' | 'values' };
export type QualifiedIdentifierTag = { tag: 'QualifiedIdentifier'; values: IdentifierTag[] };
export type AsTag = { tag: 'As'; value: IdentifierTag };
export type StringTag = { tag: 'String'; value: string };
export type NumberTag = { tag: 'Number'; value: string };
export type BooleanTag = { tag: 'Boolean'; value: string };
export type ConstantTag = NullTag | StringTag | NumberTag | BooleanTag;
export type CountTag = { tag: 'Count'; value: string };
export type TypeTag = { tag: 'Type'; value: string; param?: string };
export type DistinctTag = { tag: 'Distinct'; values: IdentifierTag[] };
export type StarIdentifierTag = { tag: 'StarIdentifier' };
export type SelectIdentifierTag = { tag: 'SelectIdentifier'; values: (IdentifierTag | StarIdentifierTag)[] };
export type CastableDataTypeTag =
  | ConstantTag
  | SelectIdentifierTag
  | SelectTag
  | ParameterTag
  | { tag: 'PgCast'; value: ConstantTag | SelectIdentifierTag | ExpressionTag | ParameterTag; type: TypeTag };
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
export type BetweenExpressionTag = { tag: 'Between'; left: DataTypeTag; right: DataTypeTag; value: DataTypeTag };
export type CastTag = { tag: 'Cast'; value: DataTypeTag; type: TypeTag };
export type ExpressionTag = CastTag | OperatorExpressionTag | BetweenExpressionTag | DataTypeTag;
export type SelectListItemTag = { tag: 'SelectListItem'; value: ExpressionTag; as?: AsTag };
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
  | TypeTag
  | DistinctTag
  | StarIdentifierTag
  | SelectIdentifierTag
  | CastableDataTypeTag
  | WhenTag
  | ElseTag
  | CaseTag
  | DataTypeTag
  | OperatorTag
  | BinaryExpressionTag
  | BetweenExpressionTag
  | CastTag
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
  | SelectTag;

export const isNull = (value: SqlTag): value is NullTag => value.tag === 'Null';
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
export const isType = (value: SqlTag): value is TypeTag => value.tag === 'Type';
export const isDistinct = (value: SqlTag): value is DistinctTag => value.tag === 'Distinct';
export const isStarIdentifier = (value: SqlTag): value is StarIdentifierTag => value.tag === 'StarIdentifier';
export const isSelectIdentifier = (value: SqlTag): value is SelectIdentifierTag => value.tag === 'SelectIdentifier';
export const isCastableDataType = (value: SqlTag): value is CastableDataTypeTag => value.tag === 'CastableDataType';
export const isWhen = (value: SqlTag): value is WhenTag => value.tag === 'When';
export const isElse = (value: SqlTag): value is ElseTag => value.tag === 'Else';
export const isCase = (value: SqlTag): value is CaseTag => value.tag === 'Case';
export const isDataType = (value: SqlTag): value is DataTypeTag => value.tag === 'DataType';
export const isOperator = (value: SqlTag): value is OperatorTag => value.tag === 'Operator';
export const isBinaryExpression = (value: SqlTag): value is BinaryExpressionTag => value.tag === 'BinaryExpression';
export const isBetweenExpression = (value: SqlTag): value is BetweenExpressionTag => value.tag === 'BetweenExpression';
export const isCast = (value: SqlTag): value is CastTag => value.tag === 'Cast';
export const isExpression = (value: SqlTag): value is ExpressionTag => value.tag === 'Expression';
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
