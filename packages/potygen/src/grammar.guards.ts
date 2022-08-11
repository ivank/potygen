/**
 * grammar.guards.ts
 *
 * Contains all [typeguards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) for the grammer ast types
 * The actual implementation is in [grammar.ts](./grammar.ts)
 * Types in [grammar.types.ts](./grammar.types.ts)
 */

import {
  AnyCastTag,
  AnyTypeTag,
  ArrayColumnIndexTag,
  ArrayConstructorTag,
  ArraySelectConstructorTag,
  ArrayIndexRangeTag,
  ArrayIndexTag,
  AsTag,
  BinaryExpressionTag,
  BinaryOperatorTag,
  BitStringTag,
  BooleanTag,
  CaseSimpleTag,
  CaseTag,
  CastableDataTypeTag,
  CastTag,
  CollateTag,
  ColumnsTag,
  ColumnTag,
  CombinationTag,
  CommentTag,
  ComparationArrayInclusionTypeTag,
  ComparationArrayOperatorTag,
  ComparationArrayTypeTag,
  ComparationArrayInclusionTag,
  ComparationArrayTag,
  ExistsTag,
  CompositeAccessTag,
  ConflictConstraintTag,
  ConflictTag,
  ConflictTargetIndexTag,
  ConflictTargetTag,
  ConstantTag,
  CountTag,
  CTENameTag,
  CTETag,
  CTEValuesListTag,
  CTEValuesTag,
  CustomQuotedStringTag,
  DataTypeTag,
  DefaultTag,
  DeleteTag,
  DistinctTag,
  DollarQuotedStringTag,
  DoNothingTag,
  DoUpdateTag,
  ElseTag,
  EmptyLeafTag,
  EscapeStringTag,
  ExpressionListTag,
  ExpressionTag,
  FilterTag,
  FromListItemTag,
  FromListTag,
  FromTag,
  FunctionArgTag,
  FunctionTag,
  GroupByTag,
  HavingTag,
  HexademicalStringTag,
  IdentifierTag,
  InsertTag,
  IntegerTag,
  JoinOnTag,
  JoinTag,
  JoinTypeTag,
  JoinUsingTag,
  LeafTag,
  LimitAllTag,
  LimitTag,
  NamedSelectTag,
  NodeTag,
  NullTag,
  NumberTag,
  OffsetTag,
  OperatorExpressionTag,
  OrderByItemTag,
  OrderByTag,
  OrderDirectionTag,
  ParameterTag,
  PgCastTag,
  QualifiedIdentifierTag,
  QuotedIdentifierTag,
  ReturningListItemTag,
  ReturningTag,
  RowTag,
  RowKeywardTag,
  SelectListItemTag,
  SelectListTag,
  SelectTag,
  SetItemTag,
  SetArrayItemTag,
  SetListTag,
  SetMapTag,
  SetTag,
  SqlTag,
  StarIdentifierTag,
  StarTag,
  StringTag,
  TableTag,
  TableWithJoinTag,
  Tag,
  TernaryExpressionTag,
  ArrayTypeTag,
  TypeTag,
  UnaryExpressionTag,
  UnaryOperatorTag,
  UnquotedIdentifierTag,
  UpdateFromTag,
  UpdateTag,
  UsingTag,
  ValuesListTag,
  ValuesTag,
  WhenTag,
  WhereTag,
  WithTag,
  WrappedExpressionTag,
  SqlName,
  AsColumnTag,
  AsColumnListTag,
  AsRecordsetTag,
  RecordsetFunctionTag,
} from './grammar.types';

export const isCTE = (value: SqlTag): value is CTETag => value.tag === SqlName.CTE;
export const isCTEName = (value: SqlTag): value is CTENameTag => value.tag === SqlName.CTEName;
export const isCTEValues = (value: SqlTag): value is CTEValuesTag => value.tag === SqlName.CTEValues;
export const isCTEValuesList = (value: SqlTag): value is CTEValuesListTag => value.tag === SqlName.CTEValuesList;
export const isWith = (value: SqlTag): value is WithTag => value.tag === SqlName.With;
export const isNull = (value: SqlTag): value is NullTag => value.tag === SqlName.Null;
export const isPgCast = (value: SqlTag): value is PgCastTag => value.tag === SqlName.PgCast;
export const isIdentifier = (value: SqlTag): value is IdentifierTag =>
  isUnquotedIdentifier(value) || isQuotedIdentifier(value);
export const isQuotedIdentifier = (value: SqlTag): value is QuotedIdentifierTag =>
  value.tag === SqlName.QuotedIdentifier;
export const isUnquotedIdentifier = (value: SqlTag): value is UnquotedIdentifierTag =>
  value.tag === SqlName.UnquotedIdentifier;
export const isParameter = (value: SqlTag): value is ParameterTag => value.tag === SqlName.Parameter;
export const isColumn = (value: SqlTag): value is ColumnTag => value.tag === SqlName.Column;
export const isAs = (value: SqlTag): value is AsTag => value.tag === SqlName.As;
export const isString = (value: SqlTag): value is StringTag => value.tag === SqlName.String;
export const isBitString = (value: SqlTag): value is BitStringTag => value.tag === SqlName.BitString;
export const isHexademicalString = (value: SqlTag): value is HexademicalStringTag =>
  value.tag === SqlName.HexademicalString;
export const isEscapeString = (value: SqlTag): value is EscapeStringTag => value.tag === SqlName.EscapeString;
export const isDollarQuotedString = (value: SqlTag): value is DollarQuotedStringTag =>
  value.tag === SqlName.DollarQuotedString;
export const isCustomQuotedString = (value: SqlTag): value is CustomQuotedStringTag =>
  value.tag === SqlName.CustomQuotedString;
export const isNumber = (value: SqlTag): value is NumberTag => value.tag === SqlName.Number;
export const isInteger = (value: SqlTag): value is IntegerTag => value.tag === SqlName.Integer;
export const isBoolean = (value: SqlTag): value is BooleanTag => value.tag === SqlName.Boolean;
export const isConstant = (value: SqlTag): value is ConstantTag =>
  isNull(value) ||
  isNumber(value) ||
  isString(value) ||
  isBoolean(value) ||
  isEscapeString(value) ||
  isBitString(value) ||
  isHexademicalString(value) ||
  isDollarQuotedString(value) ||
  isCustomQuotedString(value);
export const isCount = (value: SqlTag): value is CountTag => value.tag === SqlName.Count;
export const isArrayIndexRange = (value: SqlTag): value is ArrayIndexRangeTag => value.tag === SqlName.ArrayIndexRange;
export const isType = (value: SqlTag): value is TypeTag => value.tag === SqlName.Type;
export const isAnyType = (value: SqlTag): value is AnyTypeTag => isType(value) || isArrayType(value);
export const isArrayType = (value: SqlTag): value is ArrayTypeTag => value.tag === SqlName.ArrayType;
export const isDistinct = (value: SqlTag): value is DistinctTag => value.tag === SqlName.Distinct;
export const isStar = (value: SqlTag): value is StarTag => value.tag === SqlName.Star;
export const isStarIdentifier = (value: SqlTag): value is StarIdentifierTag => value.tag === SqlName.StarIdentifier;
export const isQualifiedIdentifier = (value: SqlTag): value is QualifiedIdentifierTag =>
  value.tag === SqlName.QualifiedIdentifier;
export const isCastableDataType = (value: SqlTag): value is CastableDataTypeTag =>
  isArrayColumnIndex(value) ||
  isColumn(value) ||
  isConstant(value) ||
  isFunction(value) ||
  isParameter(value) ||
  isPgCast(value) ||
  isSelect(value);
export const isWhen = (value: SqlTag): value is WhenTag => value.tag === SqlName.When;
export const isElse = (value: SqlTag): value is ElseTag => value.tag === SqlName.Else;
export const isCase = (value: SqlTag): value is CaseTag => value.tag === SqlName.Case;
export const isCaseSimple = (value: SqlTag): value is CaseSimpleTag => value.tag === SqlName.CaseSimple;
export const isDataType = (value: SqlTag): value is DataTypeTag =>
  isNull(value) || isCase(value) || isCaseSimple(value) || isCastableDataType(value);
export const isBinaryOperator = (value: SqlTag): value is BinaryOperatorTag => value.tag === SqlName.BinaryOperator;
export const isUnaryOperator = (value: SqlTag): value is UnaryOperatorTag => value.tag === SqlName.UnaryOperator;
export const isTernaryExpression = (value: SqlTag): value is TernaryExpressionTag =>
  value.tag === SqlName.TernaryExpression;
export const isArrayIndex = (value: SqlTag): value is ArrayIndexTag => value.tag === SqlName.ArrayIndex;
export const isArrayColumnIndex = (value: SqlTag): value is ArrayColumnIndexTag =>
  value.tag === SqlName.ArrayColumnIndex;
export const isFunction = (value: SqlTag): value is FunctionTag => value.tag === SqlName.Function;
export const isUnaryExpression = (value: SqlTag): value is UnaryExpressionTag => value.tag === SqlName.UnaryExpression;
export const isBinaryExpression = (value: SqlTag): value is BinaryExpressionTag =>
  value.tag === SqlName.BinaryExpression;
export const isCast = (value: SqlTag): value is CastTag => value.tag === SqlName.Cast;
export const isAnyCast = (value: SqlTag): value is AnyCastTag => isCast(value) || isPgCast(value);
export const isOperatorExpression = (value: SqlTag): value is OperatorExpressionTag =>
  isBinaryExpression(value) || isUnaryExpression(value);
export const isExpression = (value: SqlTag): value is ExpressionTag =>
  isFunction(value) ||
  isArrayColumnIndex(value) ||
  isCompositeAccess(value) ||
  isConstant(value) ||
  isColumn(value) ||
  isSelect(value) ||
  isParameter(value) ||
  isCast(value) ||
  isCase(value) ||
  isCaseSimple(value) ||
  isPgCast(value) ||
  isOperatorExpression(value) ||
  isTernaryExpression(value) ||
  isDataType(value) ||
  isFunction(value) ||
  isArrayIndex(value) ||
  isRow(value) ||
  isRowKeyward(value) ||
  isComparationArray(value) ||
  isComparationArrayInclusion(value) ||
  isExists(value) ||
  isWrappedExpression(value);
export const isFunctionArg = (value: SqlTag): value is FunctionArgTag => isExpression(value) || isStarIdentifier(value);
export const isCompositeAccess = (value: SqlTag): value is CompositeAccessTag => value.tag === SqlName.CompositeAccess;
export const isSelectListItem = (value: SqlTag): value is SelectListItemTag => value.tag === SqlName.SelectListItem;
export const isReturningListItem = (value: SqlTag): value is ReturningListItemTag =>
  value.tag === SqlName.ReturningListItem;
export const isSelectList = (value: SqlTag): value is SelectListTag => value.tag === SqlName.SelectList;
export const isFromListItem = (value: SqlTag): value is FromListItemTag => isTable(value) || isNamedSelect(value);
export const isNamedSelect = (value: SqlTag): value is NamedSelectTag => value.tag === SqlName.NamedSelect;
export const isFrom = (value: SqlTag): value is FromTag => value.tag === SqlName.From;
export const isFromList = (value: SqlTag): value is FromListTag => value.tag === SqlName.FromList;
export const isJoinType = (value: SqlTag): value is JoinTypeTag => value.tag === SqlName.JoinType;
export const isJoinOn = (value: SqlTag): value is JoinOnTag => value.tag === SqlName.JoinOn;
export const isJoinUsing = (value: SqlTag): value is JoinUsingTag => value.tag === SqlName.JoinUsing;
export const isJoin = (value: SqlTag): value is JoinTag => value.tag === SqlName.Join;
export const isTableWithJoin = (value: SqlTag): value is TableWithJoinTag => value.tag === SqlName.TableWithJoin;
export const isWhere = (value: SqlTag): value is WhereTag => value.tag === SqlName.Where;
export const isGroupBy = (value: SqlTag): value is GroupByTag => value.tag === SqlName.GroupBy;
export const isHaving = (value: SqlTag): value is HavingTag => value.tag === SqlName.Having;
export const isCombination = (value: SqlTag): value is CombinationTag => value.tag === SqlName.Combination;
export const isOrderDirection = (value: SqlTag): value is OrderDirectionTag => value.tag === SqlName.OrderDirection;
export const isOrderByItem = (value: SqlTag): value is OrderByItemTag => value.tag === SqlName.OrderByItem;
export const isOrderBy = (value: SqlTag): value is OrderByTag => value.tag === SqlName.OrderBy;
export const isLimit = (value: SqlTag): value is LimitTag => value.tag === SqlName.Limit;
export const isLimitAll = (value: SqlTag): value is LimitAllTag => value.tag === SqlName.LimitAll;
export const isOffset = (value: SqlTag): value is OffsetTag => value.tag === SqlName.Offset;
export const isSelect = (value: SqlTag): value is SelectTag => value.tag === SqlName.Select;
export const isDefault = (value: SqlTag): value is DefaultTag => value.tag === SqlName.Default;
export const isSetItem = (value: SqlTag): value is SetItemTag => value.tag === SqlName.SetItem;
export const isSetArrayItem = (value: SqlTag): value is SetArrayItemTag => value.tag === SqlName.SetArrayItem;
export const isSetList = (value: SqlTag): value is SetListTag => value.tag === SqlName.SetList;
export const isColumns = (value: SqlTag): value is ColumnsTag => value.tag === SqlName.Columns;
export const isValues = (value: SqlTag): value is ValuesTag => value.tag === SqlName.Values;
export const isSetMap = (value: SqlTag): value is SetMapTag => value.tag === SqlName.SetMap;
export const isSet = (value: SqlTag): value is SetTag => value.tag === SqlName.Set;
export const isTable = (value: SqlTag): value is TableTag => value.tag === SqlName.Table;
export const isUpdateFrom = (value: SqlTag): value is UpdateFromTag => value.tag === SqlName.UpdateFrom;
export const isReturning = (value: SqlTag): value is ReturningTag => value.tag === SqlName.Returning;
export const isUpdate = (value: SqlTag): value is UpdateTag => value.tag === SqlName.Update;
export const isUsing = (value: SqlTag): value is UsingTag => value.tag === SqlName.Using;
export const isDelete = (value: SqlTag): value is DeleteTag => value.tag === SqlName.Delete;
export const isValuesList = (value: SqlTag): value is ValuesListTag => value.tag === SqlName.ValuesList;
export const isInsert = (value: SqlTag): value is InsertTag => value.tag === SqlName.Insert;
export const isCollate = (value: SqlTag): value is CollateTag => value.tag === SqlName.Collate;
export const isConflictTarget = (value: SqlTag): value is ConflictTargetTag => value.tag === SqlName.ConflictTarget;
export const isConflictTargetIndex = (value: SqlTag): value is ConflictTargetIndexTag =>
  value.tag === SqlName.ConflictTargetIndex;
export const isConflictConstraint = (value: SqlTag): value is ConflictConstraintTag =>
  value.tag === SqlName.ConflictConstraint;
export const isDoNothing = (value: SqlTag): value is DoNothingTag => value.tag === SqlName.DoNothing;
export const isDoUpdate = (value: SqlTag): value is DoUpdateTag => value.tag === SqlName.DoUpdate;
export const isConflict = (value: SqlTag): value is ConflictTag => value.tag === SqlName.Conflict;
export const isArrayConstructor = (value: SqlTag): value is ArrayConstructorTag =>
  value.tag === SqlName.ArrayConstructor;
export const isArraySelectConstructor = (value: SqlTag): value is ArraySelectConstructorTag =>
  value.tag === SqlName.ArraySelectConstructor;
export const isRow = (value: SqlTag): value is RowTag => value.tag === SqlName.Row;
export const isRowKeyward = (value: SqlTag): value is RowKeywardTag => value.tag === SqlName.RowKeyward;
export const isFilter = (value: SqlTag): value is FilterTag => value.tag === SqlName.Filter;
export const isWrappedExpression = (value: SqlTag): value is WrappedExpressionTag =>
  value.tag === SqlName.WrappedExpression;
export const isExpressionList = (value: SqlTag): value is ExpressionListTag => value.tag === SqlName.ExpressionList;
export const isComment = (value: SqlTag): value is CommentTag => value.tag === SqlName.Comment;
export const isComparationArrayInclusionType = (value: SqlTag): value is ComparationArrayInclusionTypeTag =>
  value.tag === SqlName.ComparationArrayInclusionType;
export const isComparationArrayOperator = (value: SqlTag): value is ComparationArrayOperatorTag =>
  value.tag === SqlName.ComparationArrayOperator;
export const isComparationArrayType = (value: SqlTag): value is ComparationArrayTypeTag =>
  value.tag === SqlName.ComparationArrayType;
export const isComparationArrayInclusion = (value: SqlTag): value is ComparationArrayInclusionTag =>
  value.tag === SqlName.ComparationArrayInclusion;
export const isComparationArray = (value: SqlTag): value is ComparationArrayTag =>
  value.tag === SqlName.ComparationArray;
export const isExists = (value: SqlTag): value is ExistsTag => value.tag === SqlName.Exists;
export const isAsColumn = (value: SqlTag): value is AsColumnTag => value.tag === SqlName.AsColumn;
export const isAsColumnList = (value: SqlTag): value is AsColumnListTag => value.tag === SqlName.AsColumnList;
export const isAsRecordset = (value: SqlTag): value is AsRecordsetTag => value.tag === SqlName.AsRecordset;
export const isRecordsetFunction = (value: SqlTag): value is RecordsetFunctionTag =>
  value.tag === SqlName.RecordsetFunction;

export const isEmptyLeaf = (value: Tag): value is EmptyLeafTag => !('values' in value || 'value' in value);
export const isLeaf = (value: Tag): value is LeafTag => 'value' in value;
export const isNode = (value: Tag): value is NodeTag => 'values' in value;
