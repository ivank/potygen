import { Ignore, All, Any, Optional, Node, Y, Star, Rule } from '@ikerin/rd-parse';

/**
 * Comma separated list
 */
const List = (item: Rule, { last, separator = ',' }: { last?: Rule; separator?: Rule } = {}) =>
  All(Star(All(item, separator)), last ?? item);

const Brackets = (rule: Rule) => All('(', rule, ')');
const OrBrackets = (rule: Rule) => Any(All('(', rule, ')'), rule);

/**
 * Identifier
 */
const NameRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedNameRule = /^"((?:""|[^"])*)"/;
const Identifier = Node(Any(NameRule, QuotedNameRule), ([value]) => ({ tag: 'name', value }));
const QualifiedIdentifier = Node(List(Identifier, { separator: '.' }), (value) => ({
  tag: 'identifier',
  value,
}));

/**
 * AS Clause
 */
const As = Node(All(/^AS/i, Identifier), ([value]) => ({ tag: 'as', value }));

/**
 * Constant
 */

const StringRule = /^'((?:''|[^'])*)'/;
const String = Node(StringRule, ([value]) => ({ tag: 'string', value }));

const NumberRule = Any(
  /^([0-9]+)'/,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const Number = Node(NumberRule, ([value]) => ({ tag: 'number', value }));

const BooleanRule = /^(TRUE|FLASE)/i;
const Boolean = Node(BooleanRule, ([value]) => ({ tag: 'boolean', value }));

const Constant = Any(String, Number, Boolean);

const Count = Node(/^([0-9]+)/, ([value]) => ({ tag: 'count', value }));

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
  ([value, param]) => ({ tag: 'type', value, param }),
);

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

const ComparationOperator = /^(<=|>=|<>|!=|=|<|>|LIKE)/i;
const LogicalOperator = /^(AND|OR)/i;

const Select = Y((SelectExpression) => {
  /**
   * Select List
   */

  const DataType = Any(Constant, SelectIdentifier, Brackets(SelectExpression));

  const Comparation = Node(
    All(OrBrackets(DataType), ComparationOperator, OrBrackets(DataType)),
    ([a, operator, b]) => ({
      tag: 'comparation',
      a,
      b,
      operator,
    }),
  );
  const Condition = Any(Comparation, DataType);
  const Logical = Node(All(OrBrackets(Condition), LogicalOperator, OrBrackets(Condition)), ([a, operator, b]) => ({
    tag: 'logical',
    operator,
    a,
    b,
  }));
  const ConditionOrLogical = Any(Logical, Condition);

  const Cast = Node(Any(All(/^CAST/i, '(', DataType, /^AS/i, Type, ')')), ([value, type]) => ({
    tag: 'cast',
    value,
    type,
  }));

  const SelectListItem = Node(
    All(Any(Cast, Brackets(SelectExpression), SelectIdentifier, ConditionOrLogical), Optional(As)),
    (values) => ({
      tag: 'item',
      values,
    }),
  );

  const SelectList = Node(List(SelectListItem), (values) => ({
    tag: 'select_list',
    values,
  }));

  /**
   * From
   */

  const FromListItemContent = Any(QualifiedIdentifier, Brackets(SelectExpression));
  const FromListItem = Node(All(FromListItemContent, Optional(As)), (values) => ({ tag: 'item', values }));

  const From = Node(All(/^FROM/i, List(FromListItem)), (values) => ({ tag: 'FROM', values }));

  const JoinType = Node(
    Any(
      All(Optional(/^INNER/i), /^JOIN/i),
      All(/^(LEFT)/i, Optional(/^OUTER/), /^JOIN/i),
      All(/^(RIGHT)/i, Optional(/^OUTER/i), /^JOIN/i),
      All(/^(FULL)/i, Optional(/^OUTER/i), /^JOIN/i),
      /^(CROSS) JOIN/i,
    ),
    ([value]) => ({ tag: 'type', value }),
  );

  const JoinOn = Node(All(/^ON/i, Comparation), ([value]) => ({ tag: 'ON', value }));
  const JoinUsing = Node(All(/^USING/i, List(QualifiedIdentifier)), (values) => ({ tag: 'USING', values }));

  const Join = Node(All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))), (values) => ({
    tag: 'JOIN',
    values,
  }));

  /**
   * Where
   */

  const Where = Node(All(/^WHERE/i, ConditionOrLogical), (values) => ({ tag: 'WHERE', values }));

  const GroupBy = Node(All(/^GROUP BY/i, List(QualifiedIdentifier)), (values) => ({ tag: 'GROUP BY', values }));

  const Having = Node(All(/^HAVING/i, ConditionOrLogical), (values) => ({ tag: 'WHERE', values }));

  const Limit = Node(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value]) => ({
    tag: 'LIMIT',
    value,
  }));

  const Offset = Node(All(/^OFFSET/i, Count), ([value]) => ({
    tag: 'OFFSET',
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

  const OrderDirection = Node(/^(ASC|DESC|USNIG >|USING <)/i, ([value]) => ({ tag: 'direction', value }));
  const OrderByItem = Node(All(ConditionOrLogical, Optional(OrderDirection)), (values) => ({ tag: 'item', values }));
  const OrderBy = Node(All(/^ORDER BY/i, List(OrderByItem)), (values) => ({ tag: 'ORDER BY', values }));

  return Node(
    All(/^SELECT/i, SelectParts, Star(Union), Optional(OrderBy), Optional(Limit), Optional(Offset)),
    (values) => ({
      tag: 'SELECT',
      values,
    }),
  );
});

// Ignore line comments and all whitespace
export const PgSql = Ignore(/^\s+|^--[^\r\n]*\n/, Any(Select));
