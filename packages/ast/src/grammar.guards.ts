import {
  SqlTag,
  NullTag,
  PgCastTag,
  IdentifierTag,
  ParameterTag,
  ColumnTag,
  AsTag,
  StringTag,
  NumberTag,
  BooleanTag,
  CountTag,
  ArrayIndexRangeTag,
  TypeTag,
  TypeArrayTag,
  DistinctTag,
  StarTag,
  StarIdentifierTag,
  CastableDataTypeTag,
  WhenTag,
  ElseTag,
  CaseTag,
  NullIfTag,
  ConditionalExpressionTag,
  BinaryOperatorTag,
  UnaryOperatorTag,
  ComparationOperatorTag,
  BetweenTag,
  ArrayIndexTag,
  FunctionTag,
  UnaryExpressionTag,
  BinaryExpressionTag,
  CastTag,
  ExpressionTag,
  SelectListItemTag,
  ReturningListItemTag,
  SelectListTag,
  FromListItemTag,
  FromTag,
  FromListTag,
  JoinTypeTag,
  JoinOnTag,
  JoinUsingTag,
  JoinTag,
  WhereTag,
  GroupByTag,
  HavingTag,
  CombinationTag,
  OrderDirectionTag,
  OrderByItemTag,
  OrderByTag,
  LimitTag,
  OffsetTag,
  SelectTag,
  DefaultTag,
  SetItemTag,
  SetListTag,
  ColumnsTag,
  ValuesTag,
  SetMapTag,
  SetTag,
  TableTag,
  UpdateFromTag,
  ReturningTag,
  UpdateTag,
  UsingTag,
  DeleteTag,
  ValuesListTag,
  InsertTag,
  CollateTag,
  ConflictTargetTag,
  ConflictConstraintTag,
  DoNothingTag,
  DoUpdateTag,
  ConflictTag,
  ArrayConstructorTag,
  RowTag,
  ComparationExpressionTag,
  AnyCastTag,
  AnyTypeTag,
  ConstantTag,
  DataTypeTag,
  OperatorExpressionTag,
  FilterTag,
  CTETag,
  WithTag,
  NamedSelectTag,
  WrappedExpressionTag,
  NameTag,
  ExpressionListTag,
  IntegerTag,
  ComparationTypeTag,
  CaseSimpleTag,
} from './grammar.types';

export const isCTETag = (value: SqlTag): value is CTETag => value.tag === 'CTE';
export const isWithTag = (value: SqlTag): value is WithTag => value.tag === 'With';
export const isNull = (value: SqlTag): value is NullTag => value.tag === 'Null';
export const isPgCast = (value: SqlTag): value is PgCastTag => value.tag === 'PgCast';
export const isIdentifier = (value: SqlTag): value is IdentifierTag => value.tag === 'Identifier';
export const isName = (value: SqlTag): value is NameTag => value.tag === 'Name';
export const isParameter = (value: SqlTag): value is ParameterTag => value.tag === 'Parameter';
export const isColumn = (value: SqlTag): value is ColumnTag => value.tag === 'Column';
export const isAs = (value: SqlTag): value is AsTag => value.tag === 'As';
export const isString = (value: SqlTag): value is StringTag => value.tag === 'String';
export const isNumber = (value: SqlTag): value is NumberTag => value.tag === 'Number';
export const isInteger = (value: SqlTag): value is IntegerTag => value.tag === 'Integer';
export const isBoolean = (value: SqlTag): value is BooleanTag => value.tag === 'Boolean';
export const isConstant = (value: SqlTag): value is ConstantTag =>
  isNull(value) || isString(value) || isNumber(value) || isBoolean(value);
export const isCount = (value: SqlTag): value is CountTag => value.tag === 'Count';
export const isArrayIndexRange = (value: SqlTag): value is ArrayIndexRangeTag => value.tag === 'ArrayIndexRange';
export const isType = (value: SqlTag): value is TypeTag => value.tag === 'Type';
export const isAnyType = (value: SqlTag): value is AnyTypeTag => isType(value) || isTypeArray(value);
export const isTypeArray = (value: SqlTag): value is TypeArrayTag => value.tag === 'TypeArray';
export const isDistinct = (value: SqlTag): value is DistinctTag => value.tag === 'Distinct';
export const isStar = (value: SqlTag): value is StarTag => value.tag === 'Star';
export const isStarIdentifier = (value: SqlTag): value is StarIdentifierTag => value.tag === 'StarIdentifier';
export const isCastableDataType = (value: SqlTag): value is CastableDataTypeTag => value.tag === 'CastableDataType';
export const isWhen = (value: SqlTag): value is WhenTag => value.tag === 'When';
export const isElse = (value: SqlTag): value is ElseTag => value.tag === 'Else';
export const isCase = (value: SqlTag): value is CaseTag => value.tag === 'Case';
export const isCaseSimple = (value: SqlTag): value is CaseSimpleTag => value.tag === 'CaseSimple';
export const isNullIf = (value: SqlTag): value is NullIfTag => value.tag === 'NullIf';
export const isConditionalExpression = (value: SqlTag): value is ConditionalExpressionTag =>
  value.tag === 'ConditionalExpression';
export const isDataType = (value: SqlTag): value is DataTypeTag => value.tag === 'DataType';
export const isBinaryOperator = (value: SqlTag): value is BinaryOperatorTag => value.tag === 'BinaryOperator';
export const isUnaryOperator = (value: SqlTag): value is UnaryOperatorTag => value.tag === 'UnaryOperator';
export const isComparationOperator = (value: SqlTag): value is ComparationOperatorTag =>
  value.tag === 'ComparationOperator';
export const isComparationType = (value: SqlTag): value is ComparationTypeTag => value.tag === 'ComparationType';
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
  isColumn(value) ||
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
  isComparationExpression(value) ||
  isNullIf(value) ||
  isConditionalExpression(value) ||
  isWrappedExpression(value);
export const isSelectListItem = (value: SqlTag): value is SelectListItemTag => value.tag === 'SelectListItem';
export const isReturningListItem = (value: SqlTag): value is ReturningListItemTag => value.tag === 'ReturningListItem';
export const isSelectList = (value: SqlTag): value is SelectListTag => value.tag === 'SelectList';
export const isFromListItem = (value: SqlTag): value is FromListItemTag => isTable(value) || isNamedSelect(value);
export const isNamedSelect = (value: SqlTag): value is NamedSelectTag => value.tag === 'NamedSelect';
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
export const isFilter = (value: SqlTag): value is FilterTag => value.tag === 'Filter';
export const isComparationExpression = (value: SqlTag): value is ComparationExpressionTag =>
  value.tag === 'ComparationExpression';
export const isWrappedExpression = (value: SqlTag): value is WrappedExpressionTag => value.tag === 'WrappedExpression';
export const isExpressionList = (value: SqlTag): value is ExpressionListTag => value.tag === 'ExpressionList';
