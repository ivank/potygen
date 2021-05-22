import { Ignore, All, Any, Optional, Node, Y, Star, Rule, LeftBinaryOperator } from '@ikerin/rd-parse';

/**
 * Comma separated list
 */
const List = (item: Rule, { last, separator = ',' }: { last?: Rule; separator?: Rule } = {}) =>
  All(Star(All(item, separator)), last ?? item);

const Brackets = (rule: Rule) => All('(', rule, ')');
// const OrBrackets = (rule: Rule) => Any(All('(', rule, ')'), rule);

/**
 * Identifier
 */
const NameRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedNameRule = /^"((?:""|[^"])*)"/;
const Identifier = Node(Any(NameRule, QuotedNameRule), ([value]) => ({ tag: 'Identifier', value }));
const QualifiedIdentifier = Node(List(Identifier, { separator: '.' }), (value) => ({
  tag: 'QualifiedIdentifier',
  value,
}));

/**
 * AS Clause
 */
const As = Node(All(/^AS/i, Identifier), ([value]) => ({ tag: 'As', value }));

/**
 * Constant
 */

const StringRule = /^'((?:''|[^'])*)'/;
const String = Node(StringRule, ([value]) => ({ tag: 'String', value }));

const NumberRule = Any(
  /^([0-9]+)'/,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const Number = Node(NumberRule, ([value]) => ({ tag: 'Number', value }));

const BooleanRule = /^(TRUE|FLASE)/i;
const Boolean = Node(BooleanRule, ([value]) => ({ tag: 'Boolean', value }));

const Constant = Any(String, Number, Boolean);

const Count = Node(/^([0-9]+)/, ([value]) => ({ tag: 'Count', value }));

const Type = Node(
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
  ([value, param]) => (param ? { tag: 'type', value, param } : { tag: 'type', value }),
);

const Castable = (rule: Rule) =>
  Node(All(rule, Optional(All('::', Type))), ([value, type]) => (type ? { tag: 'pg_cast', type, value } : value));

/**
 * SELECT
 */

const DistinctOnList = All(/^ON/i, '(', List(Identifier), ')');
const Distinct = Node(All(/^DISTINCT/i, Optional(DistinctOnList)), (values) => ({
  tag: 'DISTINCT',
  values,
}));

const StarIdentifier = Node('*', () => ({ tag: 'star' }));
const SelectIdentifier = Node(List(Identifier, { last: Any(Identifier, StarIdentifier), separator: '.' }), (value) => ({
  tag: 'identifier',
  value,
}));

const BinaryOperatorPrecedence = [/^(<=|>=|<>|!=|=|<|>|LIKE)/i, /^(AND|OR)/i];

const Select = Y((SelectExpression) => {
  /**
   * Select List
   * SELECT * WHERE id = 5 AND name = 'test'
   */

  const DataType = Castable(Any(Constant, SelectIdentifier, Brackets(SelectExpression)));

  const Expression = BinaryOperatorPrecedence.reduce((Current, Operator) => {
    const OperatorNode = Node(Operator, ([value]) => ({ type: 'Operator', value }));
    return Node(
      All(Current, Star(All(OperatorNode, Current))),
      LeftBinaryOperator(([left, operator, right]) => ({ type: 'BinaryExpression', left, operator, right })),
    );
  }, DataType);

  const Cast = Node(Any(All(/^CAST/i, '(', DataType, /^AS/i, Type, ')')), ([value, type]) => ({
    tag: 'Cast',
    value,
    type,
  }));

  const SelectListItem = Node(All(Any(Cast, Expression), Optional(As)), (values) => ({
    tag: 'Item',
    values,
  }));

  const SelectList = Node(List(SelectListItem), (values) => ({
    tag: 'SelectList',
    values,
  }));

  /**
   * From
   */

  const FromListItemContent = Any(QualifiedIdentifier, Brackets(SelectExpression));
  const FromListItem = Node(All(FromListItemContent, Optional(As)), (values) => ({ tag: 'FromListItem', values }));

  const From = Node(All(/^FROM/i, List(FromListItem)), (values) => ({ tag: 'From', values }));

  const JoinType = Node(
    Any(
      All(Optional(/^INNER/i), /^JOIN/i),
      All(/^(LEFT)/i, Optional(/^OUTER/), /^JOIN/i),
      All(/^(RIGHT)/i, Optional(/^OUTER/i), /^JOIN/i),
      All(/^(FULL)/i, Optional(/^OUTER/i), /^JOIN/i),
      /^(CROSS) JOIN/i,
    ),
    ([value]) => ({ tag: 'JoinType', value }),
  );

  const JoinOn = Node(All(/^ON/i, Expression), ([value]) => ({ tag: 'JoinOn', value }));
  const JoinUsing = Node(All(/^USING/i, List(QualifiedIdentifier)), (values) => ({ tag: 'JoinUsing', values }));

  const Join = Node(All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))), (values) => ({
    tag: 'Join',
    values,
  }));

  /**
   * Where
   */

  const Where = Node(All(/^WHERE/i, Expression), (values) => ({ tag: 'Where', values }));

  const GroupBy = Node(All(/^GROUP BY/i, List(QualifiedIdentifier)), (values) => ({ tag: 'GroupBy', values }));

  const Having = Node(All(/^HAVING/i, Expression), (values) => ({ tag: 'Having', values }));

  const Limit = Node(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value]) => ({
    tag: 'Limit',
    value,
  }));

  const Offset = Node(All(/^OFFSET/i, Count), ([value]) => ({
    tag: 'Offset',
    value,
  }));

  const SelectParts = All(
    Optional(Any(/^ALL/i, Distinct)),
    SelectList,
    Optional(From),
    Star(Join),
    Optional(Where),
    Optional(GroupBy),
    Optional(Having),
  );

  const Union = Node(All(Any(/^(UNION|INTERSECT|EXCEPT)/i), /^SELECT/i, SelectParts), ([tag, ...values]) => ({
    tag,
    values,
  }));

  const OrderDirection = Node(/^(ASC|DESC|USNIG >|USING <)/i, ([value]) => ({ tag: 'OrderDirection', value }));
  const OrderByItem = Node(All(Expression, Optional(OrderDirection)), (values) => ({ tag: 'OrderByItem', values }));
  const OrderBy = Node(All(/^ORDER BY/i, List(OrderByItem)), (values) => ({ tag: 'OrderBy', values }));

  return Node(
    All(/^SELECT/i, SelectParts, Star(Union), Optional(OrderBy), Optional(Limit), Optional(Offset)),
    (values) => ({
      tag: 'Select',
      values,
    }),
  );
});

// Ignore line comments and all whitespace
export const PgSql = Ignore(/^\s+|^--[^\r\n]*\n/, Any(Select));
