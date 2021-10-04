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

export type ConstantTag = NullTag | StringTag | NumberTag | BooleanTag;
export type AnyTypeTag = TypeTag | TypeArrayTag;
export type SelectParts = DistinctTag | SelectListTag | FromTag | WhereTag | GroupByTag | HavingTag;
export type OperatorExpressionTag = BinaryExpressionTag | UnaryExpressionTag;
export type AnyCastTag = CastTag | PgCastTag;
export type DataTypeTag = CaseTag | CastableDataTypeTag;

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
