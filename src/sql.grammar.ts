import {
  Ignore,
  All,
  Any,
  Optional,
  Node,
  Y,
  Star,
  Rule,
  LeftBinaryOperator,
  Plus,
  IfNot,
  FunctionRule,
  Stack,
} from '@ikerin/rd-parse';
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
  StarQualifiedIdentifierTag,
  ParameterTag,
  CastableDataTypeTag,
  WhenTag,
  ElseTag,
  CaseTag,
  OperatorTag,
  BinaryExpressionTag,
  BetweenTag,
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
  DefaultTag,
  SetItemTag,
  ColumnsTag,
  ValuesTag,
  SetListTag,
  SetMapTag,
  SetTag,
  TableTag,
  UpdateFromTag,
  ReturningTag,
  UpdateTag,
  DeleteTag,
  UsingTag,
  InsertTag,
  ValuesListTag,
  QuotedNameTag,
  CollateTag,
  ConflictTargetTag,
  ConflictConstraintTag,
  DoNothingTag,
  DoUpdateTag,
  ConflictTag,
  FunctionTag,
  ArrayConstructorTag,
  TypeArrayTag,
  ArrayIndexRangeTag,
  ArrayIndexTag,
  RowTag,
  ReturningListItemTag,
  SubqueryExpressionTag,
  NullIfTag,
  ConditionalExpressionTag,
} from './sql.types';

const context = ({ pos, lastSeen: { pos: lastPos } }: Stack): { pos: number; lastPos: number } => ({ pos, lastPos });

/**
 * Comma separated list
 */
const List = (item: Rule, { last, separator = ',' }: { last?: Rule; separator?: Rule } = {}) =>
  All(Star(All(item, separator)), last ?? item);

/**
 * Comma separated list with more than one element
 */
const MultiList = (item: Rule, { separator = ',' }: { separator?: Rule } = {}) => All(item, Plus(All(separator, item)));

const Brackets = (rule: Rule) => All('(', rule, ')');
const OptionalBrackets = (rule: Rule) => Any(Brackets(rule), rule);

/**
 * Identifier
 */
const NameRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedNameRule = /^"((?:""|[^"])*)"/;
const QuotedName = Node<QuotedNameTag>(QuotedNameRule, ([value], $) => ({ tag: 'QuotedName', value, ...context($) }));

const RestrictedReservedKeywords = /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|ABORT|ABSOLUTE|ACCESS|ACTION|ADD|ADMIN|AFTER|AGGREGATE|ALSO|ALTER|ASSERTION|ASSIGNMENT|AT|BACKWARD|BEFORE|BEGIN|BY|CACHE|CALLED|CASCADE|CHAIN|CHARACTERISTICS|CHECKPOINT|CLASS|CLOSE|CLUSTER|COMMENT|COMMIT|COMMITTED|CONNECTION|CONSTRAINTS|CONVERSION|COPY|CREATEDB|CREATEROLE|CREATEUSER|CSV|CURSOR|CYCLE|DATABASE|DAY|DEALLOCATE|DECLARE|DEFAULTS|DEFERRED|DEFINER|DELETE|DELIMITER|DELIMITERS|DISABLE|DOMAIN|DOUBLE|DROP|EACH|ENABLE|ENCODING|ENCRYPTED|ESCAPE|EXCLUDING|EXCLUSIVE|EXECUTE|EXPLAIN|EXTERNAL|FETCH|FIRST|FORCE|FORWARD|FUNCTION|GLOBAL|GRANTED|HANDLER|HEADER|HOLD|HOUR|IMMEDIATE|IMMUTABLE|IMPLICIT|INCLUDING|INCREMENT|INDEX|INHERIT|INHERITS|INPUT|INSENSITIVE|INSERT|INSTEAD|INVOKER|ISOLATION|KEY|LANCOMPILER|LANGUAGE|LARGE|LAST|LEVEL|LISTEN|LOAD|LOCAL|LOCATION|LOCK|LOGIN|MATCH|MAXVALUE|MINUTE|MINVALUE|MODE|MONTH|MOVE|NAMES|NEXT|NO|NOCREATEDB|NOCREATEROLE|NOCREATEUSER|NOINHERIT|NOLOGIN|NOSUPERUSER|NOTHING|NOTIFY|NOWAIT|OBJECT|OF|OIDS|OPERATOR|OPTION|OWNER|PARTIAL|PASSWORD|PREPARE|PREPARED|PRESERVE|PRIOR|PRIVILEGES|PROCEDURAL|PROCEDURE|QUOTE|READ|RECHECK|REINDEX|RELATIVE|RELEASE|RENAME|REPEATABLE|REPLACE|RESET|RESTART|RESTRICT|RETURNS|REVOKE|ROLE|ROLLBACK|ROWS|RULE|SAVEPOINT|SCHEMA|SCROLL|SECOND|SECURITY|SEQUENCE|SERIALIZABLE|SESSION|SET|SHARE|SHOW|SIMPLE|STABLE|START|STATEMENT|STATISTICS|STDIN|STDOUT|STORAGE|STRICT|SUPERUSER|SYSID|SYSTEM|TABLESPACE|TEMP|TEMPLATE|TEMPORARY|TOAST|TRANSACTION|TRIGGER|TRUNCATE|TRUSTED|TYPE|UNCOMMITTED|UNENCRYPTED|UNKNOWN|UNLISTEN|UNTIL|UPDATE|VACUUM|VALID|VALIDATOR|VALUES|VARYING|VIEW|VOLATILE|WITH|WITHOUT|WORK|WRITE|YEAR|ZONE|CROSS|OUTER|RIGHT|LEFT|FULL|JOIN|INNER|RETURNING)$/i;
const ReservedKeywords = /^(ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|DER|RETURNING)$/i;

const RestrictedIdentifier = Node<IdentifierTag>(
  Any(IfNot(RestrictedReservedKeywords, NameRule), QuotedNameRule),
  ([value], $) => ({ tag: 'Identifier', value, ...context($) }),
);
const UnrestrictedIdentifier = Node<IdentifierTag>(Any(NameRule, QuotedNameRule), ([value], $) => {
  return { tag: 'Identifier', value, ...context($) };
});
const Identifier = Node<IdentifierTag>(Any(IfNot(ReservedKeywords, NameRule), QuotedNameRule), ([value], $) => {
  return { tag: 'Identifier', value, ...context($) };
});
const QualifiedIdentifier = Node<QualifiedIdentifierTag>(List(Identifier, { separator: '.' }), (values, $) => {
  return { tag: 'QualifiedIdentifier', values, ...context($) };
});

/**
 * Parameteer
 */
const Parameter = Node<ParameterTag>(
  All(/^(\$\$|\$|\:)/, NameRule, Optional(Any(/^(\!)/, Brackets(List(Identifier))))),
  ([type, value, ...rest], $) => ({
    tag: 'Parameter',
    value,
    type: type === '$$' ? 'spread' : 'single',
    required: rest.includes('!'),
    pick: rest.filter((item) => item !== '!'),
    ...context($),
  }),
);

/**
 * AS Clause
 */
const As = Node<AsTag>(Any(All(/^AS/i, Identifier), RestrictedIdentifier), ([value], $) => {
  return { tag: 'As', value, ...context($) };
});

/**
 * Constant
 */
const Null = Node<NullTag>(/^NULL/i, (_, $) => ({ tag: 'Null', ...context($) }));
const Integer = /^([0-9]+)/;
const NumberRule = Any(
  Integer,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = Node<StringTag>(/^'((?:''|[^'])*)'/, ([value], $) => ({ tag: 'String', value, ...context($) }));
const DollarQuatedString = Node<StringTag>(/^\$\$((?:\$\$|.)*)\$\$/, ([value], $) => {
  return { tag: 'String', value, ...context($) };
});
const CustomDollarQuatedString = Node<StringTag>(
  /^\$(?<tag>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<tag>\$/i,
  ([_, value], $) => ({ tag: 'String', value, ...context($) }),
);
const Number = Node<NumberTag>(NumberRule, ([value], $) => ({ tag: 'Number', value, ...context($) }));
const Boolean = Node<BooleanTag>(/^(TRUE|FALSE)/i, ([value], $) => ({ tag: 'Boolean', value, ...context($) }));
const Constant = Any(Null, String, DollarQuatedString, CustomDollarQuatedString, Number, Boolean);

/**
 * Type
 */
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
    /^(jsonb|json)/i,
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
    All(/^(timestamptz|timestamp|timetz|time)/i, Optional(Brackets(/^([0-9]+)/))),
    /^(tsquery)/i,
    /^(tsvector)/i,
    /^(txid_snapshot)/i,
    /^(uuid)/i,
    /^(xml)/i,
    NameRule,
  ),
  ([value, param], $) => ({ tag: 'Type', value, param, ...context($) }),
);

const TypeArray = Node<TypeArrayTag>(All(Type, Plus(/^(\[\])/)), ([value, ...dimensions], $) => {
  return { tag: 'TypeArray', value, dimensions: dimensions.length, ...context($) };
});

const AnyType = Any(TypeArray, Type);

/**
 * Count
 */
const CastableRule = (DataType: Rule) =>
  Node<CastableDataTypeTag>(Any(All(DataType, '::', AnyType), DataType), ([value, type], $) => {
    return type ? { tag: 'PgCast', type, value, ...context($) } : value;
  });

const Count = Node<CountTag>(CastableRule(Any(Integer, Parameter)), ([value], $) => {
  return { tag: 'Count', value, ...context($) };
});

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, '(', List(QualifiedIdentifier), ')');
const Distinct = Node<DistinctTag>(All(/^DISTINCT/i, Optional(DistinctOnList)), (values, $) => {
  return { tag: 'Distinct', values, ...context($) };
});

const StarIdentifier = Node<StarIdentifierTag>('*', (_, $) => ({ tag: 'StarIdentifier', ...context($) }));
const StarQualifiedIdentifier = Node<StarQualifiedIdentifierTag>(
  List(Identifier, { last: StarIdentifier, separator: '.' }),
  (values, $) => ({ tag: 'StarQualifiedIdentifier', values, ...context($) }),
);

const UnaryOperator = /^(\+|\-|NOT|ISNULL|NOTNULL)/i;

const BinaryOperatorPrecedence = [
  /^(\^)/,
  /^(\*|\/|%)/,
  /^(\+|-)/,
  /^(\+|-)/,
  /^(\|\|)/,
  /^(\|)/,
  /^(\&)/,
  /^(\#)/,
  /^(\~)/,
  /^(<<)/,
  /^(>>)/,
  /^(@@)/,
  /^(IS)/i,
  /^(IN)/i,
  /^(LIKE|ILIKE)/i,
  /^(<=|>=|<|>)/,
  /^(<>|!=|=)/,
  /^(AND)/i,
  /^(OR)/i,
];

/**
 * Order
 * ----------------------------------------------------------------------------------------
 */
const OrderRule = (Expression: Rule): Rule => {
  const OrderDirection = Node<OrderDirectionTag>(/^(ASC|DESC|USNIG >|USING <)/i, ([value], $) => {
    return { tag: 'OrderDirection', value, ...context($) };
  });
  const OrderByItem = Node<OrderByItemTag>(All(Expression, Optional(OrderDirection)), ([value, direction], $) => {
    return { tag: 'OrderByItem', value, direction, ...context($) };
  });
  return Node<OrderByTag>(All(/^ORDER BY/i, List(OrderByItem)), (values, $) => ({
    tag: 'OrderBy',
    values,
    ...context($),
  }));
};

const ExpressionRule = (SelectExpression: Rule): Rule =>
  Y((ChildExpression) => {
    /**
     * Subquery Expression
     * ----------------------------------------------------------------------------------------
     */

    const Exists = Node<SubqueryExpressionTag>(All(/^EXISTS/i, Brackets(SelectExpression)), ([subquery], $) => {
      return { tag: 'SubqueryExpression', type: 'EXISTS', subquery, ...context($) };
    });

    const InclusionSubquery = Node<SubqueryExpressionTag>(
      All(QualifiedIdentifier, /^(IN|NOT IN)/i, Brackets(SelectExpression)),
      ([value, type, subquery], $) => {
        return { tag: 'SubqueryExpression', type: type.toUpperCase(), value, subquery, ...context($) };
      },
    );

    const BooleanSubqueryOperator = /^(<=|>=|<|>|<>|!=|=|AND|OR)/;

    const OperatorSubquery = Node<SubqueryExpressionTag>(
      All(QualifiedIdentifier, BooleanSubqueryOperator, /^(ANY|SOME|ALL)/i, Brackets(SelectExpression)),
      ([value, operator, type, subquery], $) => {
        return { tag: 'SubqueryExpression', operator, type: type.toLowerCase(), value, subquery, ...context($) };
      },
    );

    const RowWiseSubquery = Node<SubqueryExpressionTag>(
      All(QualifiedIdentifier, BooleanSubqueryOperator, Brackets(SelectExpression)),
      ([value, operator, subquery], $) => {
        return { tag: 'SubqueryExpression', operator, value, subquery, ...context($) };
      },
    );

    /**
     * Conditional
     * ----------------------------------------------------------------------------------------
     */

    const NullIf = Node<NullIfTag>(
      All(/^NULLIF/i, Brackets(All(ChildExpression, ',', ChildExpression))),
      ([value, conditional], $) => ({ tag: 'NullIfTag', value, conditional, ...context($) }),
    );

    const ConditionalExpression = Node<ConditionalExpressionTag>(
      All(/^(COALESCE|GREATEST|LEAST)/i, Brackets(List(ChildExpression))),
      ([type, ...values], $) => ({ tag: 'ConditionalExpression', type: type.toUpperCase(), values, ...context($) }),
    );

    /**
     * Function
     * ----------------------------------------------------------------------------------------
     */
    const BuiltInFunction = Node<FunctionTag>(/^(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)/i, ([value], $) => ({
      tag: 'Function',
      value: { tag: 'Identifier', value, ...context($) },
      args: [],
      ...context($),
    }));

    const Function = Node<FunctionTag>(
      All(
        UnrestrictedIdentifier,
        Brackets(Optional(List(All(Any(ChildExpression, QualifiedIdentifier), Optional(OrderRule(ChildExpression)))))),
      ),
      ([value, ...args], $) => ({ tag: 'Function', value, args, ...context($) }),
    );

    const ArrayConstructor = Node<ArrayConstructorTag>(
      All(/^ARRAY/i, '[', List(ChildExpression), ']'),
      (values, $) => ({ tag: 'ArrayConstructor', values, ...context($) }),
    );

    const ArrayIndexRange = Node<ArrayIndexRangeTag>(
      All(ChildExpression, ':', ChildExpression),
      ([left, right], $) => ({ tag: 'ArrayIndexRange', left, right, ...context($) }),
    );

    const ArrayIndex = Node<ArrayIndexTag>(
      All(Any(QualifiedIdentifier, Brackets(ChildExpression)), '[', Any(ArrayIndexRange, ChildExpression), ']'),
      ([value, index], $) => ({ tag: 'ArrayIndex', value, index, ...context($) }),
    );

    const Row = Node<RowTag>(
      Any(All(/^ROW/i, Brackets(List(ChildExpression))), Brackets(MultiList(ChildExpression))),
      (values, $) => ({ tag: 'Row', values, ...context($) }),
    );

    /**
     * PgCast
     * ----------------------------------------------------------------------------------------
     */
    const DataType = Any(
      Constant,
      ArrayIndex,
      ArrayConstructor,
      Row,
      Exists,
      InclusionSubquery,
      OperatorSubquery,
      RowWiseSubquery,
      BuiltInFunction,
      NullIf,
      ConditionalExpression,
      Function,
      QualifiedIdentifier,
      Parameter,
      Brackets(SelectExpression),
      Brackets(ChildExpression),
    );

    const CastableDataType = CastableRule(DataType);

    /**
     * Case
     * ----------------------------------------------------------------------------------------
     */
    const When = Node<WhenTag>(All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression), ([condition, value], $) => ({
      tag: 'When',
      value,
      condition,
      ...context($),
    }));
    const Else = Node<ElseTag>(All(/^ELSE/i, ChildExpression), ([value], $) => ({ tag: 'Else', value, ...context($) }));
    const CaseWithExpression = Node<CaseTag>(
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
      ([expression, ...values], $) => ({ tag: 'Case', expression, values, ...context($) }),
    );
    const CaseWithoutExpression = Node<CaseTag>(All(/^CASE/i, Plus(When), Optional(Else), /^END/i), (values, $) => {
      return { tag: 'Case', values, ...context($) };
    });
    const Case = Any(CaseWithoutExpression, CaseWithExpression, CastableDataType);

    /**
     * Unary Operator
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = Node<OperatorTag>(UnaryOperator, ([value], $) => ({
      tag: 'Operator',
      value,
      ...context($),
    }));
    const UnaryExpression = Node<UnaryExpressionTag>(All(Star(UnaryOperatorNode), Case), (parts) =>
      parts.reduceRight((value, operator) => ({ tag: 'UnaryExpression', value, operator })),
    );

    /**
     * Binary Operator
     * ----------------------------------------------------------------------------------------
     */
    const BinoryOperatorExpression = BinaryOperatorPrecedence.reduce((Current, Operator) => {
      const OperatorNode = Node<OperatorTag>(Operator, ([value], $) => ({ tag: 'Operator', value, ...context($) }));
      return Node<BinaryExpressionTag>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator(([left, operator, right], $) => {
          return { tag: 'BinaryExpression', left, operator, right, ...context($) };
        }),
      );
    }, UnaryExpression);

    /**
     * Between Operator
     * ----------------------------------------------------------------------------------------
     */
    const BetweenExpression = Node<BetweenTag>(
      All(DataType, /^BETWEEN/i, DataType, /^AND/i, DataType),
      ([value, left, right], $) => ({ tag: 'Between', left, right, value, ...context($) }),
    );

    /**
     * Cast
     * ----------------------------------------------------------------------------------------
     */
    const Cast = Node<CastTag>(All(/^CAST/i, '(', DataType, /^AS/i, AnyType, ')'), ([value, type], $) => {
      return { tag: 'Cast', value, type, ...context($) };
    });

    return Any(Cast, BetweenExpression, BinoryOperatorExpression);
  });

const FromListRule = (Select: Rule): Rule => {
  const FromListItem = Node<FromListItemTag>(
    All(Any(QualifiedIdentifier, Brackets(Select)), Optional(As)),
    ([value, as], $) => ({ tag: 'FromListItem', value, as, ...context($) }),
  );
  return Node<FromListTag>(List(FromListItem), (values, $) => ({ tag: 'FromList', values, ...context($) }));
};

const WhereRule = (Expression: Rule): Rule =>
  Node<WhereTag>(All(/^WHERE/i, Expression), ([value], $) => ({ tag: 'Where', value, ...context($) }));

const Select = Y((SelectExpression) => {
  const Expression = ExpressionRule(SelectExpression);

  const SelectListItem = Node<SelectListItemTag>(
    Any(StarQualifiedIdentifier, All(Any(Expression), Optional(As))),
    ([value, as], $) => ({ tag: 'SelectListItem', value, as, ...context($) }),
  );
  const SelectList = Node<SelectListTag>(List(SelectListItem), (values, $) => {
    return { tag: 'SelectList', values, ...context($) };
  });

  /**
   * From
   * ----------------------------------------------------------------------------------------
   */
  const FromList = FromListRule(SelectExpression);

  const JoinType = Node<JoinTypeTag>(
    Any(
      All(Optional(/^INNER/i), /^JOIN/i),
      All(/^(LEFT)/i, Optional(/^OUTER/), /^JOIN/i),
      All(/^(RIGHT)/i, Optional(/^OUTER/i), /^JOIN/i),
      All(/^(FULL)/i, Optional(/^OUTER/i), /^JOIN/i),
      /^(CROSS) JOIN/i,
    ),
    ([value], $) => ({ tag: 'JoinType', value: value?.toUpperCase(), ...context($) }),
  );
  const JoinOn = Node<JoinOnTag>(All(/^ON/i, Expression), ([value], $) => ({ tag: 'JoinOn', value, ...context($) }));
  const JoinUsing = Node<JoinUsingTag>(All(/^USING/i, List(QualifiedIdentifier)), (values, $) => {
    return { tag: 'JoinUsing', values, ...context($) };
  });
  const Join = Node<JoinTag>(
    All(JoinType, QualifiedIdentifier, Optional(As), Optional(Any(JoinOn, JoinUsing))),
    ([type, table, ...values], $) => {
      return { tag: 'Join', type, table, values, ...context($) };
    },
  );

  const From = Node<FromTag>(All(/^FROM/i, FromList, Star(Join)), ([list, ...join], $) => {
    return { tag: 'From', list, join, ...context($) };
  });

  /**
   * Where
   * ----------------------------------------------------------------------------------------
   */
  const Where = WhereRule(Expression);

  /**
   * Group By
   * ----------------------------------------------------------------------------------------
   */
  const GroupBy = Node<GroupByTag>(All(/^GROUP BY/i, OptionalBrackets(List(QualifiedIdentifier))), (values, $) => ({
    tag: 'GroupBy',
    values,
    ...context($),
  }));

  /**
   * Having
   * ----------------------------------------------------------------------------------------
   */
  const Having = Node<HavingTag>(All(/^HAVING/i, Expression), ([value], $) => ({
    tag: 'Having',
    value,
    ...context($),
  }));

  /**
   * Select Parts
   * ----------------------------------------------------------------------------------------
   */
  const SelectParts = [
    Optional(Any(/^ALL/i, Distinct)),
    SelectList,
    Optional(From),
    Optional(Where),
    Optional(GroupBy),
    Optional(Having),
  ];

  /**
   * Combination
   * ----------------------------------------------------------------------------------------
   */
  const Combination = Node<CombinationTag>(
    All(/^(UNION|INTERSECT|EXCEPT)/i, /^SELECT/i, ...SelectParts),
    ([type, ...values], $) => ({ tag: 'Combination', type: type.toUpperCase(), values, ...context($) }),
  );

  /**
   * Order
   * ----------------------------------------------------------------------------------------
   */
  const OrderBy = OrderRule(Expression);

  /**
   * Limit
   * ----------------------------------------------------------------------------------------
   */
  const Limit = Node<LimitTag>(All(/^LIMIT/i, Any(Count, /^ALL/i)), ([value], $) => {
    return { tag: 'Limit', value, ...context($) };
  });
  const Offset = Node<OffsetTag>(All(/^OFFSET/i, Count), ([value], $) => ({ tag: 'Offset', value, ...context($) }));

  return Node<SelectTag>(
    All(
      /^SELECT/i,
      ...SelectParts,
      Star(Combination),
      Optional(OrderBy),
      Optional(Any(All(Limit, Offset), All(Offset, Limit), Limit, Offset)),
    ),
    (values, $) => ({ tag: 'Select', values, ...context($) }),
  );
});

/**
 * Expressions
 * ----------------------------------------------------------------------------------------
 */
const Expression = ExpressionRule(Select);
const FromList = FromListRule(Select);
const Where = WhereRule(Expression);
const Table = Node<TableTag>(All(Optional(/^ONLY/i), QualifiedIdentifier, Optional(As)), ([value, as], $) => {
  return { tag: 'Table', value, as, ...context($) };
});
const Columns = Node<ColumnsTag>(Brackets(List(Identifier)), (values, $) => {
  return { tag: 'Columns', values, ...context($) };
});
const Default = Node<DefaultTag>(/^DEFAULT/i, (_, $) => ({ tag: 'Default', ...context($) }));

/**
 * Update
 * ----------------------------------------------------------------------------------------
 */

const SetItem = Node<SetItemTag>(All(QualifiedIdentifier, '=', Any(Default, Expression)), ([column, value], $) => ({
  tag: 'SetItem',
  column,
  value,
  ...context($),
}));

const Values = Node<ValuesTag>(Brackets(List(Any(Default, Expression))), (values, $) => {
  return { tag: 'Values', values, ...context($) };
});
const SetList = Node<SetListTag>(List(SetItem), (values, $) => ({ tag: 'SetList', values, ...context($) }));
const SetMap = Node<SetMapTag>(
  All(Columns, '=', Any(All(Optional(/^ROW/i), Values), Brackets(Select))),
  ([columns, values], $) => ({ tag: 'SetMap', columns, values, ...context($) }),
);

const Set = Node<SetTag>(All(/^SET/i, Any(SetList, SetMap)), ([value], $) => ({ tag: 'Set', value, ...context($) }));

const UpdateFrom = Node<UpdateFromTag>(All(/^FROM/i, List(FromList)), (values, $) => {
  return { tag: 'UpdateFrom', values, ...context($) };
});
const ReturningListItem = Node<ReturningListItemTag>(
  Any(StarQualifiedIdentifier, All(Any(Expression), Optional(As))),
  ([value, as], $) => ({ tag: 'ReturningListItem', value, as, ...context($) }),
);
const Returning = Node<ReturningTag>(All(/^RETURNING/i, List(ReturningListItem)), (values, $) => {
  return { tag: 'Returning', values, ...context($) };
});
const Update = Node<UpdateTag>(
  All(/^UPDATE/i, Table, Set, Optional(UpdateFrom), Optional(Where), Optional(Returning)),
  (values, $) => ({ tag: 'Update', values, ...context($) }),
);

/**
 * Delete
 * ----------------------------------------------------------------------------------------
 */
const Using = Node<UsingTag>(All(/^USING/i, List(FromList)), (values, $) => ({ tag: 'Using', values, ...context($) }));
const Delete = Node<DeleteTag>(
  All(/^DELETE FROM/i, Table, Optional(Using), Optional(Where), Optional(Returning)),
  (values, $) => ({ tag: 'Delete', values, ...context($) }),
);

/**
 * Insert
 * ----------------------------------------------------------------------------------------
 */
const Collate = Node<CollateTag>(All(/^COLLATE/i, QuotedName), ([value], $) => ({
  tag: 'Collate',
  value,
  ...context($),
}));
const ConflictTarget = Node<ConflictTargetTag>(
  All(Brackets(All(Table, Optional(Brackets(Expression)), Optional(Collate))), Optional(Where)),
  (values, $) => ({ tag: 'ConflictTarget', values, ...context($) }),
);
const ConflictConstraint = Node<ConflictConstraintTag>(All(/^ON CONSTRAINT/i, Identifier), ([value], $) => {
  return { tag: 'ConflictConstraint', value, ...context($) };
});

const DoNothing = Node<DoNothingTag>(/^DO NOTHING/i, (_, $) => ({ tag: 'DoNothing', ...context($) }));
const DoUpdate = Node<DoUpdateTag>(All(/^DO UPDATE/i, Set, Optional(Where)), ([value, where], $) => {
  return { tag: 'DoUpdate', value, where, ...context($) };
});
const Conflict = Node<ConflictTag>(
  All(
    /^ON CONFLICT/i,
    Any(Any(DoNothing, DoUpdate), All(Any(ConflictTarget, ConflictConstraint), Any(DoNothing, DoUpdate))),
  ),
  (values, $) => ({ tag: 'Conflict', values, ...context($) }),
);

const ValuesList = Node<ValuesListTag>(All(/^VALUES/i, Any(List(Values), Parameter)), (values, $) => {
  return { tag: 'ValuesList', values, ...context($) };
});
const Insert = Node<InsertTag>(
  All(/^INSERT INTO/i, Table, Optional(Columns), Any(ValuesList, Select), Optional(Conflict), Optional(Returning)),
  (values, $) => ({ tag: 'Insert', values, ...context($) }),
);

// Ignore line comments and all whitespace
const IgnoreComments = (node: FunctionRule) => Ignore(/^\s+|^--[^\r\n]*\n/, node);

export const SqlGrammar = IgnoreComments(Any(Select, Update, Delete, Insert));
