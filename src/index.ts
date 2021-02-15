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

const ComparationOperator = /^(<=|>=|<>|!=|=|<|>|LIKE)/;
const LogicalOperator = /^(AND|OR)/;

const Select = Y((SelectExpression) => {
  /**
   * Select List
   */
  const SelectListItem = Node(All(Any(Brackets(SelectExpression), SelectIdentifier), Optional(As)), (values) => ({
    tag: 'item',
    values,
  }));

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
      All(Optional(/^INNER/), /^JOIN/),
      All(/^(LEFT)/, Optional(/^OUTER/), /^JOIN/),
      All(/^(RIGHT)/, Optional(/^OUTER/), /^JOIN/),
      All(/^(FULL)/, Optional(/^OUTER/), /^JOIN/),
      /^(CROSS) JOIN/,
    ),
    ([value]) => ({ tag: 'type', value }),
  );

  const JoinOn = Node(All(/^ON/, Comparation), ([value]) => ({ tag: 'ON', value }));
  const JoinUsing = Node(All(/^USING/, List(QualifiedIdentifier)), (values) => ({ tag: 'USING', values }));

  const Join = Node(All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))), (values) => ({
    tag: 'JOIN',
    values,
  }));

  /**
   * Where
   */

  const Where = Node(All(/^WHERE/i, ConditionOrLogical), (values) => ({ tag: 'WHERE', values }));

  const GroupBy = Node(All(/^GROUP BY/i, List(QualifiedIdentifier)), (values) => ({ tag: 'GROUP BY', values }));

  const Limit = Node(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value]) => ({
    tag: 'LIMIT',
    value,
  }));
  const Offset = Node(All(/^OFFSET/i, Count), ([value]) => ({
    tag: 'OFFSET',
    value,
  }));

  return Node(
    All(
      /^SELECT/i,
      Optional(Any(/^ALL/i, Distinct)),
      SelectList,
      Optional(From),
      Star(Join),
      Optional(Where),
      Optional(GroupBy),
      Optional(Limit),
      Optional(Offset),
    ),
    (values) => ({ tag: 'SELECT', values }),
  );
});

/**
 * Keywords
 */

// Ignore line comments and all whitespace
export const PgSql = Ignore(/^\s+|^--[^\r\n]*\n/, Any(Select));
