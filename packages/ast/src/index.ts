import { Parser } from '@ikerin/rd-parse';
import { Grammar } from './grammar';
import { AstTag, CommentTag } from './grammar.types';

export {
  AnyCastTag,
  AnyTypeTag,
  ArrayColumnIndexTag,
  ArrayConstructorTag,
  ArrayIndexRangeTag,
  ArrayIndexTag,
  AsTag,
  AstTag,
  BeginTag,
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
  ComparationExpressionTag,
  ComparationOperatorTag,
  CompositeAccessTag,
  ConflictConstraintTag,
  ConflictTag,
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
  DimensionTag,
  DistinctTag,
  DollarQuotedStringTag,
  DoNothingTag,
  DoUpdateTag,
  ElseTag,
  EmptyLeafSqlTag,
  EmptyLeafTag,
  EscapeStringTag,
  ExpressionListTag,
  ExpressionTag,
  ExtractFieldTag,
  ExtractTag,
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
  JoinOnTag,
  JoinTag,
  JoinTypeTag,
  JoinUsingTag,
  LeafSqlTag,
  LimitAllTag,
  LimitTag,
  NamedSelectTag,
  NodeSqlTag,
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
  QueryTag,
  QuotedIdentifierTag,
  ReturningListItemTag,
  ReturningTag,
  RollbackTag,
  RowTag,
  SavepointTag,
  SelectListItemTag,
  SelectListTag,
  SelectParts,
  SelectTag,
  SetItemTag,
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
  TernaryOperatorTag,
  TernarySeparatorTag,
  TypeArrayTag,
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
} from './grammar.types';

export {
  isAnyCast,
  isAnyType,
  isArrayColumnIndex,
  isArrayConstructor,
  isArrayIndex,
  isArrayIndexRange,
  isAs,
  isBinaryExpression,
  isBinaryOperator,
  isBitString,
  isBoolean,
  isCase,
  isCaseSimple,
  isCast,
  isCastableDataType,
  isCollate,
  isColumn,
  isColumns,
  isCombination,
  isComment,
  isComparationExpression,
  isComparationOperator,
  isComparationType,
  isCompositeAccess,
  isConflict,
  isConflictConstraint,
  isConflictTarget,
  isConflictTargetIndex,
  isConstant,
  isCount,
  isCTE,
  isCTEName,
  isCTEValues,
  isCTEValuesList,
  isCustomQuotedString,
  isDataType,
  isDefault,
  isDelete,
  isDistinct,
  isDollarQuotedString,
  isDoNothing,
  isDoUpdate,
  isElse,
  isEmptyLeaf,
  isEscapeString,
  isExpression,
  isExpressionList,
  isFilter,
  isFrom,
  isFromList,
  isFromListItem,
  isFunction,
  isFunctionArg,
  isGroupBy,
  isHaving,
  isHexademicalString,
  isIdentifier,
  isInsert,
  isInteger,
  isJoin,
  isJoinOn,
  isJoinType,
  isJoinUsing,
  isLeaf,
  isLimit,
  isLimitAll,
  isNamedSelect,
  isNode,
  isNull,
  isNumber,
  isOffset,
  isOperatorExpression,
  isOrderBy,
  isOrderByItem,
  isOrderDirection,
  isParameter,
  isPgCast,
  isQualifiedIdentifier,
  isQuotedIdentifier,
  isReturning,
  isReturningListItem,
  isRow,
  isSelect,
  isSelectList,
  isSelectListItem,
  isSet,
  isSetItem,
  isSetList,
  isSetMap,
  isStar,
  isStarIdentifier,
  isString,
  isTable,
  isTableWithJoin,
  isTernaryExpression,
  isType,
  isTypeArray,
  isUnaryExpression,
  isUnaryOperator,
  isUnquotedIdentifier,
  isUpdate,
  isUpdateFrom,
  isUsing,
  isValues,
  isValuesList,
  isWhen,
  isWhere,
  isWith,
  isWrappedExpression,
} from './grammar.guards';

export {
  chunk,
  first,
  groupBy,
  identity,
  initial,
  isDiffBy,
  isEmpty,
  isEqual,
  isNil,
  isObject,
  isUnique,
  isUniqueBy,
  last,
  orderBy,
  tail,
  toMilliseconds,
  range,
} from './util';

export { Grammar } from './grammar';

export const parser = Parser<AstTag, CommentTag>(Grammar);
