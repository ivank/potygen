import { Ignore, All, Any, Optional, Node, Y, Star, Rule, LeftBinaryOperator, Plus } from '@ikerin/rd-parse';

export enum Tag {
  Identifier = 'Identifier',
  QualifiedIdentifier = 'QualifiedIdentifier',
  As = 'As',
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Count = 'Count',
  Type = 'Type',
  PgCast = 'PgCast',
  Distinct = 'Distinct',
  StarIdentifier = 'StarIdentifier',
  SelectIdentifier = 'SelectIdentifier',
  When = 'When',
  Else = 'Else',
  Case = 'Case',
  Operator = 'Operator',
  BinaryExpression = 'BinaryExpression',
  Between = 'Between',
  Cast = 'Cast',
  SelectListItem = 'SelectListItem',
  SelectList = 'SelectList',
  FromListItem = 'FromListItem',
  From = 'From',
  JoinType = 'JoinType',
  JoinOn = 'JoinOn',
  JoinUsing = 'JoinUsing',
  Join = 'Join',
  Where = 'Where',
  GroupBy = 'GroupBy',
  Having = 'Having',
  Limit = 'Limit',
  Offset = 'Offset',
  OrderDirection = 'OrderDirection',
  OrderByItem = 'OrderByItem',
  OrderBy = 'OrderBy',
  Select = 'Select',
  UnionSelect = 'UnionSelect',
  IntersectSelect = 'IntersectSelect',
  ExceptSelect = 'ExceptSelect',
}

export type IdentifierTag = { tag: Tag.Identifier; value: string };
export type QualifiedIdentifierTag = { tag: Tag.QualifiedIdentifier; values: IdentifierTag[] };
export type AsTag = { tag: Tag.As; value: IdentifierTag };
export type StringTag = { tag: Tag.String; value: string };
export type NumberTag = { tag: Tag.Number; value: string };
export type BooleanTag = { tag: Tag.Boolean; value: string };
export type ConstantTag = StringTag | NumberTag | BooleanTag;
export type CountTag = { tag: Tag.Count; value: string };
export type TypeTag = { tag: Tag.Type; value: string; param?: string };
export type DistinctTag = { tag: Tag.Distinct; values: IdentifierTag[] };
export type StarIdentifierTag = { tag: Tag.StarIdentifier };
export type SelectIdentifierTag = { tag: Tag.SelectIdentifier; values: (IdentifierTag | StarIdentifierTag)[] };
export type CastableDataTypeTag =
  | ConstantTag
  | SelectIdentifierTag
  | { tag: Tag.PgCast; value: ConstantTag | SelectIdentifierTag | ExpressionTag; type: TypeTag };
export type WhenTag = { tag: Tag.When; condition: ExpressionTag; value: ExpressionTag };
export type ElseTag = { tag: Tag.Else; value: ExpressionTag };
export type CaseTag = { tag: Tag.Case; expression?: CastableDataTypeTag; values: (WhenTag | ElseTag)[] };
export type DataTypeTag = CaseTag | CastableDataTypeTag;
export type OperatorTag = { tag: Tag.Operator; value: string };
export type BinaryExpressionTag = {
  tag: Tag.BinaryExpression;
  left: DataTypeTag | BinaryExpressionTag;
  right: DataTypeTag | BinaryExpressionTag;
  operator: OperatorTag;
};
export type BetweenExpressionTag = { tag: Tag.Between; left: DataTypeTag; right: DataTypeTag; value: DataTypeTag };
export type CastTag = { tag: Tag.Cast; value: DataTypeTag; type: TypeTag };
export type ExpressionTag = CastTag | BinaryExpressionTag | BetweenExpressionTag | DataTypeTag;
export type SelectListItemTag = { tag: Tag.SelectListItem; value: ExpressionTag; as?: AsTag };
export type SelectListTag = { tag: Tag.SelectList; values: SelectListItemTag[] };
export type FromListItemTag = { tag: Tag.FromListItem; value: QualifiedIdentifierTag | ExpressionTag; as?: AsTag };
export type FromTag = { tag: Tag.From; values: FromListItemTag[] };

/**
 * Comma separated list
 */
const List = (item: Rule, { last, separator = ',' }: { last?: Rule; separator?: Rule } = {}) =>
  All(Star(All(item, separator)), last ?? item);

const Brackets = (rule: Rule) => All('(', rule, ')');

/**
 * Identifier
 */
const NameRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedNameRule = /^"((?:""|[^"])*)"/;
const Identifier = Node<IdentifierTag>(Any(NameRule, QuotedNameRule), ([value]) => ({ tag: Tag.Identifier, value }));
const QualifiedIdentifier = Node<QualifiedIdentifierTag>(List(Identifier, { separator: '.' }), (values) => {
  return { tag: Tag.QualifiedIdentifier, values };
});

/**
 * AS Clause
 */
const As = Node<AsTag>(All(/^AS/i, Identifier), ([value]) => ({ tag: Tag.As, value }));

/**
 * Constant
 */
const NumberRule = Any(
  /^([0-9]+)'/,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = Node<StringTag>(/^'((?:''|[^'])*)'/, ([value]) => ({ tag: Tag.String, value }));
const Number = Node<NumberTag>(NumberRule, ([value]) => ({ tag: Tag.Number, value }));
const Boolean = Node<BooleanTag>(/^(TRUE|FALSE)/i, ([value]) => ({ tag: Tag.Boolean, value }));
const Constant = Any(String, Number, Boolean);

const Count = Node<CountTag>(/^([0-9]+)/, ([value]) => ({ tag: Tag.Count, value }));

const Type = Node<TypeTag>(
  Any(
    /^(bigint|int8)/i,
    /^(bigserial|serial8)/i,
    All(/^(bit varying|varbit)/i, Optional(Brackets(/^([0-9]+)/))),
    All(/^(bit)/i, Optional(Brackets(/^([0-9]+)/))),
    /^(boolean|bool)/i,
    /^(box)/i,
    /^(bytea)/i,
    All(/^(character varying|varchar|character|char)/i, Optional(Brackets(/^([0-9]+)/))),
    /^(cidr)/i,
    /^(circle)/i,
    /^(date)/i,
    /^(double precision|float8)/i,
    /^(inet)/i,
    /^(integer|int4|int)/i,
    All(/^(interval)/i, Optional(Brackets(/^([0-9]+)/))),
    /^(json|jsonb)/i,
    /^(line)/i,
    /^(lseg)/i,
    /^(macaddr)/i,
    /^(money)/i,
    All(/^(numeric|decimal)/i, Optional(Brackets(Any(/^([0-9]+)/, All(/^([0-9]+)/, ',', /^([0-9]+)/))))),
    /^(path)/i,
    /^(pg_lsn)/i,
    /^(point)/i,
    /^(polygon)/i,
    /^(real|float4)/i,
    /^(smallint|int2)/i,
    /^(smallserial|serial2)/i,
    /^(serial4|serial)/i,
    /^(text)/i,
    All(/^(time|timestamp|timetz|timestamptz)/i, Optional(Brackets(/^([0-9]+)/))),
    /^(tsquery)/i,
    /^(tsvector)/i,
    /^(txid_snapshot)/i,
    /^(uuid)/i,
    /^(xml)/i,
  ),
  ([value, param]) => ({ tag: Tag.Type, value, param }),
);

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, '(', List(Identifier), ')');
const Distinct = Node<DistinctTag>(All(/^DISTINCT/i, Optional(DistinctOnList)), (values) => {
  return { tag: Tag.Distinct, values };
});

const StarIdentifier = Node<StarIdentifierTag>('*', () => ({ tag: Tag.StarIdentifier }));
const SelectIdentifier = Node<SelectIdentifierTag>(
  List(Identifier, { last: Any(Identifier, StarIdentifier), separator: '.' }),
  (values) => ({ tag: Tag.SelectIdentifier, values }),
);

const BinaryOperatorPrecedence = [
  /^(\^)/i,
  /^(\*|%)/i,
  /^(\*|%)/i,
  /^(IN)/i,
  /^(LIKE|ILIKE)/i,
  /^(<=|>=|<|>)/,
  /^(<>|!=|=)/,
  /^(AND)/,
  /^(OR)/,
];

const Select = Y((SelectExpression) => {
  const Expression = Y((ChildExpression) => {
    const CastableDataType = Node<CastableDataTypeTag>(
      All(
        Any(Constant, SelectIdentifier, Brackets(SelectExpression), Brackets(ChildExpression)),
        Optional(All('::', Type)),
      ),
      ([value, type]) => (type ? { tag: Tag.PgCast, type, value } : value),
    );

    /**
     * Case
     */
    const When = Node<WhenTag>(All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression), ([condition, value]) => {
      return { tag: Tag.When, value, condition };
    });
    const Else = Node<ElseTag>(All(/^ELSE/i, ChildExpression), ([value]) => ({ tag: Tag.Else, value }));
    const CaseWithExpression = Node<CaseTag>(
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
      ([expression, ...values]) => ({ tag: Tag.Case, expression, values }),
    );
    const CaseWithoutExpression = Node<CaseTag>(All(/^CASE/i, Plus(When), Optional(Else), /^END/i), (values) => {
      return { tag: Tag.Case, values };
    });
    const DataType = Any(CaseWithoutExpression, CaseWithExpression, CastableDataType);

    /**
     * Binary Operation
     * ----------------------------------------------------------------------------------------
     */
    const BinoryOperatorExpression = BinaryOperatorPrecedence.reduce((Current, Operator) => {
      const OperatorNode = Node<OperatorTag>(Operator, ([value]) => ({ tag: Tag.Operator, value }));
      return Node<BinaryExpressionTag>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator(([left, operator, right]) => ({ tag: Tag.BinaryExpression, left, operator, right })),
      );
    }, DataType);
    const BetweenExpression = Node<BetweenExpressionTag>(
      All(DataType, /^BETWEEN/i, DataType, /^AND/i, DataType),
      ([value, left, right]) => {
        return { tag: Tag.Between, left, right, value };
      },
    );

    const Cast = Node<CastTag>(All(/^CAST/i, '(', DataType, /^AS/i, Type, ')'), ([value, type]) => {
      return { tag: Tag.Cast, value, type };
    });

    return Any(Cast, BetweenExpression, BinoryOperatorExpression);
  });

  const SelectListItem = Node<SelectListItemTag>(All(Any(Expression), Optional(As)), ([value, as]) => {
    return { tag: Tag.SelectListItem, value, as };
  });
  const SelectList = Node<SelectListTag>(List(SelectListItem), (values) => ({ tag: Tag.SelectList, values }));

  /**
   * From
   */

  const FromListItem = Node<FromListItemTag>(
    All(Any(QualifiedIdentifier, Brackets(SelectExpression)), Optional(As)),
    ([value, as]) => {
      return { tag: Tag.FromListItem, value, as };
    },
  );
  const From = Node<FromTag>(All(/^FROM/i, List(FromListItem)), (values) => ({ tag: Tag.From, values }));

  const JoinType = Node(
    Any(
      All(Optional(/^INNER/i), /^JOIN/i),
      All(/^(LEFT)/i, Optional(/^OUTER/), /^JOIN/i),
      All(/^(RIGHT)/i, Optional(/^OUTER/i), /^JOIN/i),
      All(/^(FULL)/i, Optional(/^OUTER/i), /^JOIN/i),
      /^(CROSS) JOIN/i,
    ),
    ([value]) => ({ tag: Tag.JoinType, value }),
  );
  const JoinOn = Node(All(/^ON/i, Expression), ([value]) => ({ tag: Tag.JoinOn, value }));
  const JoinUsing = Node(All(/^USING/i, List(QualifiedIdentifier)), (values) => ({ tag: Tag.JoinUsing, values }));
  const Join = Node(All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))), (values) => {
    return { tag: Tag.Join, values };
  });

  /**
   * Where
   */

  const Where = Node(All(/^WHERE/i, Expression), (values) => ({ tag: Tag.Where, values }));
  const GroupBy = Node(All(/^GROUP BY/i, List(QualifiedIdentifier)), (values) => ({ tag: Tag.GroupBy, values }));
  const Having = Node(All(/^HAVING/i, Expression), (values) => ({ tag: Tag.Having, values }));
  const Limit = Node(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value]) => ({ tag: Tag.Limit, value }));
  const Offset = Node(All(/^OFFSET/i, Count), ([value]) => ({ tag: Tag.Offset, value }));

  const SelectParts = All(
    Optional(Any(/^ALL/i, Distinct)),
    SelectList,
    Optional(From),
    Star(Join),
    Optional(Where),
    Optional(GroupBy),
    Optional(Having),
  );

  const UnionTypes: [RegExp, Tag][] = [
    [/^UNION/i, Tag.UnionSelect],
    [/^INTERSECT/i, Tag.IntersectSelect],
    [/^EXCEPT/i, Tag.ExceptSelect],
  ];

  const Union = Any(
    ...UnionTypes.map(([type, tag]) => Node(All(type, /^SELECT/i, SelectParts), (values) => ({ tag, values }))),
  );

  const OrderDirection = Node(/^(ASC|DESC|USNIG >|USING <)/i, ([value]) => ({ tag: Tag.OrderDirection, value }));
  const OrderByItem = Node(All(Expression, Optional(OrderDirection)), (values) => ({ tag: Tag.OrderByItem, values }));
  const OrderBy = Node(All(/^ORDER BY/i, List(OrderByItem)), (values) => ({ tag: Tag.OrderBy, values }));

  return Node(
    All(/^SELECT/i, SelectParts, Star(Union), Optional(OrderBy), Optional(Limit), Optional(Offset)),
    (values) => ({ tag: Tag.Select, values }),
  );
});

// Ignore line comments and all whitespace
export const SqlGrammar = Ignore(/^\s+|^--[^\r\n]*\n/, Any(Select));
