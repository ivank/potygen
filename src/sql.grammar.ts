import { Ignore, All, Any, Optional, Node, Y, Star, Rule, LeftBinaryOperator, Plus } from '@ikerin/rd-parse';
import {
  IdentifierTag,
  QualifiedIdentifierTag,
  AsTag,
  StringTag,
  NumberTag,
  BooleanTag,
  CountTag,
  TypeTag,
  DistinctTag,
  StarIdentifierTag,
  SelectIdentifierTag,
  ParameterTag,
  CastableDataTypeTag,
  WhenTag,
  ElseTag,
  CaseTag,
  OperatorTag,
  BinaryExpressionTag,
  BetweenExpressionTag,
  CastTag,
  SelectListItemTag,
  SelectListTag,
  FromListItemTag,
  FromTag,
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
  FromListTag,
  UnaryExpressionTag,
  NullTag,
} from './sql.types';

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
const Identifier = Node<IdentifierTag>(Any(NameRule, QuotedNameRule), ([value]) => ({ tag: 'Identifier', value }));
const QualifiedIdentifier = Node<QualifiedIdentifierTag>(List(Identifier, { separator: '.' }), (values) => {
  return { tag: 'QualifiedIdentifier', values };
});

/**
 * Parameteer
 */
const Parameter = Node<ParameterTag>(All(/^(\$|\:|\$\$)/, NameRule), ([type, value]) => ({
  tag: 'Parameter',
  value,
  type: type === '$$' ? 'values' : 'native',
}));

/**
 * AS Clause
 */
const As = Node<AsTag>(All(/^AS/i, Identifier), ([value]) => ({ tag: 'As', value }));

/**
 * Constant
 */
const Null = Node<NullTag>(/^NULL/i, () => ({ tag: 'Null' }));
const NumberRule = Any(
  /^([0-9]+)'/,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = Node<StringTag>(/^'((?:''|[^'])*)'/, ([value]) => ({ tag: 'String', value }));
const DollarQuatedString = Node<StringTag>(/^\$\$((?:\$\$|.)*)\$\$/, ([value]) => ({ tag: 'String', value }));
const CustomDollarQuatedString = Node<StringTag>(
  /^\$(?<tag>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<tag>\$/i,
  ([tag, value]) => ({ tag: 'String', value }),
);
const Number = Node<NumberTag>(NumberRule, ([value]) => ({ tag: 'Number', value }));
const Boolean = Node<BooleanTag>(/^(TRUE|FALSE)/i, ([value]) => ({ tag: 'Boolean', value }));
const Constant = Any(Null, String, DollarQuatedString, CustomDollarQuatedString, Number, Boolean);

const Count = Node<CountTag>(/^([0-9]+)/, ([value]) => ({ tag: 'Count', value }));

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
  ([value, param]) => ({ tag: 'Type', value, param }),
);

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, '(', List(Identifier), ')');
const Distinct = Node<DistinctTag>(All(/^DISTINCT/i, Optional(DistinctOnList)), (values) => {
  return { tag: 'Distinct', values };
});

const StarIdentifier = Node<StarIdentifierTag>('*', () => ({ tag: 'StarIdentifier' }));
const SelectIdentifier = Node<SelectIdentifierTag>(
  List(Identifier, { last: Any(Identifier, StarIdentifier), separator: '.' }),
  (values) => ({ tag: 'SelectIdentifier', values }),
);

const UnaryOperator = /^(\+|\-|NOT|ISNULL|NOTNULL)/i;

const BinaryOperatorPrecedence = [
  /^(\^)/i,
  /^(\*|\/|%)/i,
  /^(\+|-)/i,
  /^(\+|-)/i,
  /^(\|\|)/i,
  /^(IS)/i,
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
        Any(Constant, SelectIdentifier, Parameter, Brackets(SelectExpression), Brackets(ChildExpression)),
        Optional(All('::', Type)),
      ),
      ([value, type]) => (type ? { tag: 'PgCast', type, value } : value),
    );

    /**
     * Case
     */
    const When = Node<WhenTag>(All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression), ([condition, value]) => {
      return { tag: 'When', value, condition };
    });
    const Else = Node<ElseTag>(All(/^ELSE/i, ChildExpression), ([value]) => ({ tag: 'Else', value }));
    const CaseWithExpression = Node<CaseTag>(
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
      ([expression, ...values]) => ({ tag: 'Case', expression, values }),
    );
    const CaseWithoutExpression = Node<CaseTag>(All(/^CASE/i, Plus(When), Optional(Else), /^END/i), (values) => {
      return { tag: 'Case', values };
    });
    const DataType = Any(CaseWithoutExpression, CaseWithExpression, CastableDataType);

    /**
     * Unary Operation
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = Node<OperatorTag>(UnaryOperator, ([value]) => ({ tag: 'Operator', value }));
    const UnaryExpression = Node<UnaryExpressionTag>(All(Star(UnaryOperatorNode), DataType), (parts) =>
      parts.reduceRight((value, operator) => ({ tag: 'UnaryExpression', value, operator })),
    );

    /**
     * Binary Operation
     * ----------------------------------------------------------------------------------------
     */
    const BinoryOperatorExpression = BinaryOperatorPrecedence.reduce((Current, Operator) => {
      const OperatorNode = Node<OperatorTag>(Operator, ([value]) => ({ tag: 'Operator', value }));
      return Node<BinaryExpressionTag>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator(([left, operator, right]) => ({ tag: 'BinaryExpression', left, operator, right })),
      );
    }, UnaryExpression);

    const BetweenExpression = Node<BetweenExpressionTag>(
      All(DataType, /^BETWEEN/i, DataType, /^AND/i, DataType),
      ([value, left, right]) => {
        return { tag: 'Between', left, right, value };
      },
    );

    const Cast = Node<CastTag>(All(/^CAST/i, '(', DataType, /^AS/i, Type, ')'), ([value, type]) => {
      return { tag: 'Cast', value, type };
    });

    return Any(Cast, BetweenExpression, BinoryOperatorExpression);
  });

  const SelectListItem = Node<SelectListItemTag>(All(Any(Expression), Optional(As)), ([value, as]) => {
    return { tag: 'SelectListItem', value, as };
  });
  const SelectList = Node<SelectListTag>(List(SelectListItem), (values) => ({ tag: 'SelectList', values }));

  /**
   * From
   */

  const FromListItem = Node<FromListItemTag>(
    All(Any(QualifiedIdentifier, Brackets(SelectExpression)), Optional(As)),
    ([value, as]) => {
      return { tag: 'FromListItem', value, as };
    },
  );
  const FromList = Node<FromListTag>(List(FromListItem), (values) => ({ tag: 'FromList', values }));

  const JoinType = Node<JoinTypeTag>(
    Any(
      All(Optional(/^INNER/i), /^JOIN/i),
      All(/^(LEFT)/i, Optional(/^OUTER/), /^JOIN/i),
      All(/^(RIGHT)/i, Optional(/^OUTER/i), /^JOIN/i),
      All(/^(FULL)/i, Optional(/^OUTER/i), /^JOIN/i),
      /^(CROSS) JOIN/i,
    ),
    ([value]) => ({ tag: 'JoinType', value: value?.toUpperCase() }),
  );
  const JoinOn = Node<JoinOnTag>(All(/^ON/i, Expression), ([value]) => ({ tag: 'JoinOn', value }));
  const JoinUsing = Node<JoinUsingTag>(All(/^USING/i, List(QualifiedIdentifier)), (values) => ({
    tag: 'JoinUsing',
    values,
  }));
  const Join = Node<JoinTag>(
    All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))),
    ([type, table, ...values]) => {
      return { tag: 'Join', type, table, values };
    },
  );

  const From = Node<FromTag>(All(/^FROM/, FromList, Star(Join)), ([list, ...join]) => ({ tag: 'From', list, join }));

  /**
   * Where
   */

  const Where = Node<WhereTag>(All(/^WHERE/i, Expression), ([value]) => ({ tag: 'Where', value }));
  const GroupBy = Node<GroupByTag>(All(/^GROUP BY/i, List(QualifiedIdentifier)), (values) => ({
    tag: 'GroupBy',
    values,
  }));
  const Having = Node<HavingTag>(All(/^HAVING/i, Expression), ([value]) => ({ tag: 'Having', value }));

  const SelectParts = [
    Optional(Any(/^ALL/i, Distinct)),
    SelectList,
    Optional(From),
    Optional(Where),
    Optional(GroupBy),
    Optional(Having),
  ];

  const Combination = Node<CombinationTag>(
    All(/^(UNION|INTERSECT|EXCEPT)/i, /^SELECT/i, ...SelectParts),
    ([type, ...values]) => {
      return { tag: 'Combination', type: type.toUpperCase(), values };
    },
  );

  const OrderDirection = Node<OrderDirectionTag>(/^(ASC|DESC|USNIG >|USING <)/i, ([value]) => {
    return { tag: 'OrderDirection', value };
  });
  const OrderByItem = Node<OrderByItemTag>(All(Expression, Optional(OrderDirection)), ([value, direction]) => {
    return { tag: 'OrderByItem', value, direction };
  });
  const OrderBy = Node<OrderByTag>(All(/^ORDER BY/i, List(OrderByItem)), (values) => ({ tag: 'OrderBy', values }));
  const Limit = Node<LimitTag>(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value]) => ({ tag: 'Limit', value }));
  const Offset = Node<OffsetTag>(All(/^OFFSET/i, Count), ([value]) => ({ tag: 'Offset', value }));

  return Node<SelectTag>(
    All(/^SELECT/i, ...SelectParts, Star(Combination), Optional(OrderBy), Optional(Limit), Optional(Offset)),
    (values) => ({ tag: 'Select', values }),
  );
});

// Ignore line comments and all whitespace
export const SqlGrammar = Ignore(/^\s+|^--[^\r\n]*\n/, Any(Select));
