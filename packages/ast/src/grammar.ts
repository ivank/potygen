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
  ColumnTag,
  AsTag,
  StringTag,
  NumberTag,
  BooleanTag,
  CountTag,
  TypeTag,
  DistinctTag,
  StarTag,
  StarIdentifierTag,
  ParameterTag,
  CastableDataTypeTag,
  WhenTag,
  ElseTag,
  CaseTag,
  BinaryOperatorTag,
  UnaryOperatorTag,
  ComparationOperatorTag,
  BinaryExpressionTag,
  BetweenTag,
  CastTag,
  SelectListItemTag,
  SelectListTag,
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
  ComparationExpressionTag,
  NullIfTag,
  ConditionalExpressionTag,
  FilterTag,
  WithTag,
  CTETag,
  NamedSelectTag,
  WrappedExpressionTag,
  NameTag,
  ExpressionListTag,
  QueryTag,
  IntegerTag,
  ExpressionTag,
  ComparationTypeTag,
  CaseSimpleTag,
  LimitAllTag,
} from './grammar.types';
import { AnyTypeTag, DataTypeTag } from '.';

const context = ({ pos }: Stack, { pos: nextPos }: Stack): { pos: number; nextPos: number } => ({ pos, nextPos });

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
const QuotedName = Node<QuotedNameTag>(QuotedNameRule, ([value], $, $next) => {
  return { tag: 'QuotedName', value, ...context($, $next) };
});

const RestrictedReservedKeywords =
  /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|ABORT|ABSOLUTE|ACCESS|ACTION|ADD|ADMIN|AFTER|AGGREGATE|ALSO|ALTER|ASSERTION|ASSIGNMENT|AT|BACKWARD|BEFORE|BEGIN|BY|CACHE|CALLED|CASCADE|CHAIN|CHARACTERISTICS|CHECKPOINT|CLASS|CLOSE|CLUSTER|COMMENT|COMMIT|COMMITTED|CONNECTION|CONSTRAINTS|CONVERSION|COPY|CREATEDB|CREATEROLE|CREATEUSER|CSV|CURSOR|CYCLE|DATABASE|DAY|DEALLOCATE|DECLARE|DEFAULTS|DEFERRED|DEFINER|DELETE|DELIMITER|DELIMITERS|DISABLE|DOMAIN|DOUBLE|DROP|EACH|ENABLE|ENCODING|ENCRYPTED|ESCAPE|EXCLUDING|EXCLUSIVE|EXECUTE|EXPLAIN|EXTERNAL|FETCH|FIRST|FORCE|FORWARD|FUNCTION|GLOBAL|GRANTED|HANDLER|HEADER|HOLD|HOUR|IMMEDIATE|IMMUTABLE|IMPLICIT|INCLUDING|INCREMENT|INDEX|INHERIT|INHERITS|INPUT|INSENSITIVE|INSERT|INSTEAD|INVOKER|ISOLATION|KEY|LANCOMPILER|LANGUAGE|LARGE|LAST|LEVEL|LISTEN|LOAD|LOCAL|LOCATION|LOCK|LOGIN|MATCH|MAXVALUE|MINUTE|MINVALUE|MODE|MONTH|MOVE|NAMES|NEXT|NO|NOCREATEDB|NOCREATEROLE|NOCREATEUSER|NOINHERIT|NOLOGIN|NOSUPERUSER|NOTHING|NOTIFY|NOWAIT|OBJECT|OF|OIDS|OPERATOR|OPTION|OWNER|PARTIAL|PASSWORD|PREPARE|PREPARED|PRESERVE|PRIOR|PRIVILEGES|PROCEDURAL|PROCEDURE|QUOTE|READ|RECHECK|REINDEX|RELATIVE|RELEASE|RENAME|REPEATABLE|REPLACE|RESET|RESTART|RESTRICT|RETURNS|REVOKE|ROLE|ROLLBACK|ROWS|RULE|SAVEPOINT|SCHEMA|SCROLL|SECOND|SECURITY|SEQUENCE|SERIALIZABLE|SESSION|SET|SHARE|SHOW|SIMPLE|STABLE|START|STATEMENT|STATISTICS|STDIN|STDOUT|STORAGE|STRICT|SUPERUSER|SYSID|SYSTEM|TABLESPACE|TEMP|TEMPLATE|TEMPORARY|TOAST|TRANSACTION|TRIGGER|TRUNCATE|TRUSTED|TYPE|UNCOMMITTED|UNENCRYPTED|UNKNOWN|UNLISTEN|UNTIL|UPDATE|VACUUM|VALID|VALIDATOR|VALUES|VARYING|VIEW|VOLATILE|WITH|WITHOUT|WORK|WRITE|YEAR|ZONE|CROSS|OUTER|RIGHT|LEFT|FULL|JOIN|INNER|RETURNING)$/i;
const ReservedKeywords =
  /^(ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|DER|RETURNING)$/i;

const RestrictedIdentifier = Node<IdentifierTag>(
  Any(IfNot(RestrictedReservedKeywords, NameRule), QuotedNameRule),
  ([value], $, $next) => ({ tag: 'Identifier', value, ...context($, $next) }),
);
const UnrestrictedIdentifier = Node<IdentifierTag>(Any(NameRule, QuotedNameRule), ([value], $, $next) => {
  return { tag: 'Identifier', value, ...context($, $next) };
});
const Identifier = Node<IdentifierTag>(Any(IfNot(ReservedKeywords, NameRule), QuotedNameRule), ([value], $, $next) => {
  return { tag: 'Identifier', value, ...context($, $next) };
});

const Column = Any(
  Node<ColumnTag, [IdentifierTag, IdentifierTag, IdentifierTag]>(
    All(Identifier, '.', Identifier, '.', Identifier),
    (values, $, $next) => ({ tag: 'Column', values, ...context($, $next) }),
  ),
  Node<ColumnTag, [IdentifierTag, IdentifierTag]>(All(Identifier, '.', Identifier), (values, $, $next) => {
    return { tag: 'Column', values, ...context($, $next) };
  }),
  Node<ColumnTag, [IdentifierTag]>(Identifier, (values, $, $next) => {
    return { tag: 'Column', values, ...context($, $next) };
  }),
);

/**
 * Parameteer
 */
const Name = Node<NameTag>(NameRule, ([value], $, $next) => ({ tag: 'Name', value, ...context($, $next) }));

const Parameter = Node<ParameterTag>(
  All(/^(\$\$|\$|\:)/, NameRule, Optional(Any(/^(\!)/, Brackets(List(Name))))),
  ([type, value, ...rest], $, $next) => ({
    tag: 'Parameter',
    value,
    type: type === '$$' ? 'spread' : 'single',
    required: rest.includes('!'),
    pick: rest.filter((item) => item !== '!'),
    ...context($, $next),
  }),
);

/**
 * AS Clause
 */
const As = Node<AsTag, [IdentifierTag]>(Any(All(/^AS/i, Identifier), RestrictedIdentifier), (values, $, $next) => {
  return { tag: 'As', values, ...context($, $next) };
});

/**
 * Constant
 */
const Null = Node<NullTag>(/^NULL/i, (_, $, $next) => ({ tag: 'Null', ...context($, $next) }));
const IntegerRule = /^([0-9]+)/;
const NumberRule = Any(
  IntegerRule,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = Node<StringTag>(/^'((?:''|[^'])*)'/, ([value], $, $next) => ({
  tag: 'String',
  value,
  ...context($, $next),
}));
const DollarQuatedString = Node<StringTag>(/^\$\$((?:\$\$|.)*)\$\$/, ([value], $, $next) => {
  return { tag: 'String', value, ...context($, $next) };
});
const CustomDollarQuatedString = Node<StringTag>(
  /^\$(?<tag>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<tag>\$/i,
  ([_, value], $, $next) => ({ tag: 'String', value, ...context($, $next) }),
);
const Integer = Node<IntegerTag>(IntegerRule, ([value], $, $next) => ({ tag: 'Integer', value, ...context($, $next) }));
const Number = Node<NumberTag>(NumberRule, ([value], $, $next) => ({ tag: 'Number', value, ...context($, $next) }));
const Boolean = Node<BooleanTag>(/^(TRUE|FALSE)/i, ([value], $, $next) => ({
  tag: 'Boolean',
  value,
  ...context($, $next),
}));
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
    All(/^(numeric|decimal)/i, Optional(Brackets(Any(All(/^([0-9]+)/, ',', /^([0-9]+)/), /^([0-9]+)/)))),
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
  ([value, param], $, $next) => ({ tag: 'Type', value: value.toLowerCase(), param, ...context($, $next) }),
);

const TypeArray = Node<TypeArrayTag, [TypeTag, ...string[]]>(
  All(Type, Plus(/^(\[\])/)),
  ([type, ...dimensions], $, $next) => {
    return { tag: 'TypeArray', values: [type], value: dimensions.length, ...context($, $next) };
  },
);

const AnyType = Any(TypeArray, Type);

/**
 * Count
 */
const CastableRule = (DataType: Rule) =>
  Node<CastableDataTypeTag>(Any(All(DataType, '::', AnyType), DataType), ([value, type], $, $next) => {
    return type ? { tag: 'PgCast', values: [value, type], ...context($, $next) } : value;
  });

const Count = Node<CountTag, [IntegerTag | ParameterTag]>(CastableRule(Any(Integer, Parameter)), (values, $, $next) => {
  return { tag: 'Count', values, ...context($, $next) };
});

/**
 * Table
 */
const Table = Any(
  Node<TableTag>(All(Identifier, '.', Identifier, Optional(As)), ([schema, table, as], $, $next) => {
    return { tag: 'Table', table, schema, as, ...context($, $next) };
  }),
  Node<TableTag>(All(Identifier, Optional(As)), ([table, as], $, $next) => {
    return { tag: 'Table', table, as, ...context($, $next) };
  }),
);

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, '(', List(Column), ')');
const Distinct = Node<DistinctTag, ColumnTag[]>(All(/^DISTINCT/i, Optional(DistinctOnList)), (values, $, $next) => {
  return { tag: 'Distinct', values, ...context($, $next) };
});

const StarSql = Node<StarTag, []>('*', (_, $, $next) => ({ tag: 'Star', ...context($, $next) }));
const StarIdentifier = Any(
  Node<StarIdentifierTag, [IdentifierTag, IdentifierTag, StarTag]>(
    All(Identifier, '.', Identifier, '.', StarSql),
    (values, $, $next) => ({ tag: 'StarIdentifier', values, ...context($, $next) }),
  ),
  Node<StarIdentifierTag, [IdentifierTag, StarTag]>(All(Identifier, '.', StarSql), (values, $, $next) => {
    return { tag: 'StarIdentifier', values, ...context($, $next) };
  }),
  Node<StarIdentifierTag, [StarTag]>(StarSql, (values, $, $next) => {
    return { tag: 'StarIdentifier', values, ...context($, $next) };
  }),
);

const UnaryOperator = /^(\+|\-|NOT|ISNULL|NOTNULL)/i;

const BinaryOperatorPrecedence = [
  /^(\^)/,
  /^(\*|\/|%)/,
  /^(\+|-)/,
  /^(->>|->|#>>|#>|@>|<@|\?\||\?\&|\?|#-|!!|<->)/,
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
  const OrderDirection = Node<OrderDirectionTag>(/^(ASC|DESC|USNIG >|USING <)/i, ([value], $, $next) => {
    return { tag: 'OrderDirection', value, ...context($, $next) };
  });
  const OrderByItem = Node<OrderByItemTag, [ExpressionTag] | [ExpressionTag, OrderDirectionTag]>(
    All(Expression, Optional(OrderDirection)),
    (values, $, $next) => ({ tag: 'OrderByItem', values, ...context($, $next) }),
  );
  return Node<OrderByTag, OrderByItemTag[]>(All(/^ORDER BY/i, List(OrderByItem)), (values, $, $next) => {
    return { tag: 'OrderBy', values, ...context($, $next) };
  });
};

const ExpressionRule = (SelectExpression: Rule): Rule =>
  Y((ChildExpression) => {
    const ArrayConstructor = Node<ArrayConstructorTag>(
      All(/^ARRAY/i, '[', List(ChildExpression), ']'),
      (values, $, $next) => ({ tag: 'ArrayConstructor', values, ...context($, $next) }),
    );

    const ExpressionList = Node<ExpressionListTag>(List(ChildExpression), (values, $, $next) => {
      return { tag: 'ExpressionList', values, ...context($, $next) };
    });

    /**
     * Comparation Expression
     * ----------------------------------------------------------------------------------------
     */

    const ComparationTypeExists = Node<ComparationTypeTag>(/^EXISTS/i, (_, $, $next) => {
      return { tag: 'ComparationType', value: 'EXISTS', ...context($, $next) };
    });
    const ComparationTypeInclusion = Node<ComparationTypeTag>(/^(IN|NOT IN)/i, ([type], $, $next) => {
      return { tag: 'ComparationType', value: type.toUpperCase(), ...context($, $next) };
    });
    const ComparationTypeOperator = Node<ComparationTypeTag>(/^(ANY|SOME|ALL)/i, ([type], $, $next) => {
      return { tag: 'ComparationType', value: type.toUpperCase(), ...context($, $next) };
    });

    const Exists = Node<ComparationExpressionTag, [ComparationTypeTag, SelectTag]>(
      All(ComparationTypeExists, Brackets(SelectExpression)),
      (values, $, $next) => ({ tag: 'ComparationExpression', values, ...context($, $next) }),
    );

    const InclusionComparation = Node<ComparationExpressionTag, [ColumnTag, ComparationTypeTag, SelectTag]>(
      All(Column, ComparationTypeInclusion, Brackets(SelectExpression)),
      (values, $, $next) => ({ tag: 'ComparationExpression', values, ...context($, $next) }),
    );

    const ComparationOperator = Node<ComparationOperatorTag>(/^(<=|>=|<|>|<>|!=|=|AND|OR)/, ([value], $, $next) => ({
      tag: 'ComparationOperator',
      value: value.toUpperCase(),
      ...context($, $next),
    }));

    const OperatorComparation = Node<
      ComparationExpressionTag,
      [ColumnTag, ComparationOperatorTag, ComparationTypeTag, ArrayConstructorTag | SelectTag | ExpressionListTag]
    >(
      All(
        Column,
        ComparationOperator,
        ComparationTypeOperator,
        Brackets(Any(ArrayConstructor, SelectExpression, ExpressionList)),
      ),
      (values, $, $next) => ({ tag: 'ComparationExpression', values, ...context($, $next) }),
    );

    const RowWiseComparation = Node<ComparationExpressionTag, [ColumnTag, ComparationOperatorTag, SelectTag]>(
      All(Column, ComparationOperator, Brackets(SelectExpression)),
      (values, $, $next) => ({ tag: 'ComparationExpression', values, ...context($, $next) }),
    );

    /**
     * Conditional
     * ----------------------------------------------------------------------------------------
     */

    const NullIf = Node<NullIfTag, [ExpressionTag, ExpressionTag]>(
      All(/^NULLIF/i, Brackets(All(ChildExpression, ',', ChildExpression))),
      (values, $, $next) => ({ tag: 'NullIfTag', values, ...context($, $next) }),
    );

    const ConditionalExpression = Node<ConditionalExpressionTag>(
      All(/^(COALESCE|GREATEST|LEAST)/i, Brackets(List(ChildExpression))),
      ([type, ...values], $, $next) => ({
        tag: 'ConditionalExpression',
        type: type.toUpperCase(),
        values,
        ...context($, $next),
      }),
    );

    /**
     * Function
     * ----------------------------------------------------------------------------------------
     */
    const BuiltInFunction = Node<FunctionTag>(
      /^(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)/i,
      ([value], $, $next) => {
        return { tag: 'Function', values: [{ tag: 'Identifier', value, ...context($, $next) }], ...context($, $next) };
      },
    );

    const FunctionDistinct = Node<DistinctTag>(/^DISTINCT/i, (values, $, $next) => {
      return { tag: 'Distinct', values, ...context($, $next) };
    });

    const FunctionFilter = Node<FilterTag, [WhereTag]>(
      All(/^FILTER/i, Brackets(WhereRule(ChildExpression))),
      (values, $, $next) => ({ tag: 'Filter', values, ...context($, $next) }),
    );

    const Function = Node<FunctionTag, [IdentifierTag, ...(ExpressionTag | DistinctTag | OrderByTag | FilterTag)[]]>(
      All(
        UnrestrictedIdentifier,
        Brackets(
          Optional(List(All(Optional(FunctionDistinct), ChildExpression, Optional(OrderRule(ChildExpression))))),
        ),
        Optional(FunctionFilter),
      ),
      (values, $, $next) => ({ tag: 'Function', values, ...context($, $next) }),
    );

    const ArrayIndexRange = Node<ArrayIndexRangeTag, [ExpressionTag, ExpressionTag]>(
      All(ChildExpression, ':', ChildExpression),
      (values, $, $next) => ({ tag: 'ArrayIndexRange', values, ...context($, $next) }),
    );

    const ArrayIndex = Node<ArrayIndexTag, [ExpressionTag, ArrayIndexRangeTag | ExpressionTag]>(
      All(Any(Column, Brackets(ChildExpression)), '[', Any(ArrayIndexRange, ChildExpression), ']'),
      (values, $, $next) => ({ tag: 'ArrayIndex', values, ...context($, $next) }),
    );

    const Row = Node<RowTag>(
      Any(All(/^ROW/i, Brackets(List(ChildExpression))), Brackets(MultiList(ChildExpression))),
      (values, $, $next) => ({ tag: 'Row', values, ...context($, $next) }),
    );

    const WrappedExpression = Node<WrappedExpressionTag>(Brackets(ChildExpression), ([value], $, $next) => {
      return { tag: 'WrappedExpression', value, ...context($, $next) };
    });

    /**
     * PgCast
     * ----------------------------------------------------------------------------------------
     */
    const DataType = Any(
      NullIf,
      Constant,
      ArrayIndex,
      ArrayConstructor,
      Row,
      Exists,
      InclusionComparation,
      OperatorComparation,
      RowWiseComparation,
      BuiltInFunction,
      ConditionalExpression,
      Function,
      Column,
      Parameter,
      Brackets(SelectExpression),
      WrappedExpression,
    );

    const CastableDataType = CastableRule(DataType);

    /**
     * Case
     * ----------------------------------------------------------------------------------------
     */
    const When = Node<WhenTag, [ExpressionTag, ExpressionTag]>(
      All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression),
      (values, $, $next) => ({ tag: 'When', values, ...context($, $next) }),
    );
    const Else = Node<ElseTag, [ExpressionTag]>(All(/^ELSE/i, ChildExpression), (values, $, $next) => {
      return { tag: 'Else', values, ...context($, $next) };
    });
    const CaseSimple = Node<CaseSimpleTag, [CastableDataTypeTag, ...(WhenTag | ElseTag)[]]>(
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
      (values, $, $next) => ({ tag: 'CaseSimple', values, ...context($, $next) }),
    );
    const CaseNormal = Node<CaseTag, (WhenTag | ElseTag)[]>(
      All(/^CASE/i, Plus(When), Optional(Else), /^END/i),
      (values, $, $next) => ({ tag: 'Case', values, ...context($, $next) }),
    );
    const Case = Any(CaseNormal, CaseSimple, CastableDataType);

    /**
     * Unary Operator
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = Node<UnaryOperatorTag>(UnaryOperator, ([value], $, $next) => {
      return { tag: 'UnaryOperator', value: value.toUpperCase(), ...context($, $next) };
    });
    const UnaryExpression = Node<UnaryExpressionTag>(All(Star(UnaryOperatorNode), Case), (parts, $, $next) =>
      parts.reduceRight((value, operator) => {
        return { tag: 'UnaryExpression', values: [operator, value], ...context($, $next) };
      }),
    );

    /**
     * Binary Operator
     * ----------------------------------------------------------------------------------------
     */
    const BinoryOperatorExpression = BinaryOperatorPrecedence.reduce((Current, Operator) => {
      const OperatorNode = Node<BinaryOperatorTag>(Operator, ([value], $, $next) => {
        return { tag: 'BinaryOperator', value: value.toUpperCase(), ...context($, $next) };
      });
      return Node<BinaryExpressionTag, any>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator((values, $, $next) => ({ tag: 'BinaryExpression', values, ...context($, $next) })),
      );
    }, UnaryExpression);

    /**
     * Between Operator
     * ----------------------------------------------------------------------------------------
     */
    const BetweenExpression = Node<BetweenTag, [DataTypeTag, DataTypeTag, DataTypeTag]>(
      All(DataType, /^BETWEEN/i, DataType, /^AND/i, DataType),
      (values, $, $next) => ({ tag: 'Between', values, ...context($, $next) }),
    );

    /**
     * Cast
     * ----------------------------------------------------------------------------------------
     */
    const Cast = Node<CastTag, [DataTypeTag, AnyTypeTag]>(
      All(/^CAST/i, '(', DataType, /^AS/i, AnyType, ')'),
      (values, $, $next) => ({ tag: 'Cast', values, ...context($, $next) }),
    );

    return Any(Cast, BetweenExpression, BinoryOperatorExpression);
  });

const FromListRule = (Select: Rule): Rule => {
  const NamedSelect = Node<NamedSelectTag, [SelectTag, AsTag]>(All(Brackets(Select), As), (values, $, $next) => {
    return { tag: 'NamedSelect', values, ...context($, $next) };
  });
  return Node<FromListTag>(List(Any(Table, NamedSelect)), (values, $, $next) => {
    return { tag: 'FromList', values, ...context($, $next) };
  });
};

const WhereRule = (Expression: Rule): Rule =>
  Node<WhereTag, [ExpressionTag]>(All(/^WHERE/i, Expression), (values, $, $next) => {
    return { tag: 'Where', values, ...context($, $next) };
  });

const Select = Y((SelectExpression) => {
  const Expression = ExpressionRule(SelectExpression);

  const SelectListItem = Node<SelectListItemTag, [StarIdentifierTag] | [ExpressionTag] | [ExpressionTag, AsTag]>(
    Any(StarIdentifier, All(Any(Expression), Optional(As))),
    (values, $, $next) => ({ tag: 'SelectListItem', values, ...context($, $next) }),
  );
  const SelectList = Node<SelectListTag>(List(SelectListItem), (values, $, $next) => {
    return { tag: 'SelectList', values, ...context($, $next) };
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
    ([value], $, $next) => ({ tag: 'JoinType', value: value?.toUpperCase(), ...context($, $next) }),
  );
  const JoinOn = Node<JoinOnTag, [ExpressionTag]>(All(/^ON/i, Expression), (values, $, $next) => {
    return { tag: 'JoinOn', values, ...context($, $next) };
  });
  const JoinUsing = Node<JoinUsingTag>(All(/^USING/i, List(Column)), (values, $, $next) => {
    return { tag: 'JoinUsing', values, ...context($, $next) };
  });
  const Join = Node<JoinTag, [JoinTypeTag, TableTag] | [JoinTypeTag, TableTag, JoinOnTag | JoinUsingTag]>(
    All(JoinType, Table, Optional(Any(JoinOn, JoinUsing))),
    (values, $, $next) => ({ tag: 'Join', values, ...context($, $next) }),
  );

  const From = Node<FromTag, [FromListTag, ...JoinTag[]]>(All(/^FROM/i, FromList, Star(Join)), (values, $, $next) => {
    return { tag: 'From', values, ...context($, $next) };
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
  const GroupBy = Node<GroupByTag>(All(/^GROUP BY/i, OptionalBrackets(List(Column))), (values, $, $next) => {
    return { tag: 'GroupBy', values, ...context($, $next) };
  });

  /**
   * Having
   * ----------------------------------------------------------------------------------------
   */
  const Having = Node<HavingTag, [ExpressionTag]>(All(/^HAVING/i, Expression), (values, $, $next) => {
    return { tag: 'Having', values, ...context($, $next) };
  });

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
    ([type, ...values], $, $next) => ({ tag: 'Combination', type: type.toUpperCase(), values, ...context($, $next) }),
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
  const LimitAll = Node<LimitAllTag>(/^ALL/i, (_, $, $next) => ({ tag: 'LimitAll', ...context($, $next) }));
  const Limit = Node<LimitTag, [CountTag | LimitAllTag]>(All(/^LIMIT/i, Any(Count, LimitAll)), (values, $, $next) => {
    return { tag: 'Limit', values, ...context($, $next) };
  });
  const Offset = Node<OffsetTag, [CountTag]>(All(/^OFFSET/i, Count), (values, $, $next) => {
    return { tag: 'Offset', values, ...context($, $next) };
  });

  return Node<SelectTag>(
    All(
      /^SELECT/i,
      ...SelectParts,
      Star(Combination),
      Optional(OrderBy),
      Optional(Any(All(Limit, Offset), All(Offset, Limit), Limit, Offset)),
      Optional(';'),
    ),
    (values, $, $next) => ({ tag: 'Select', values, ...context($, $next) }),
  );
});

/**
 * Expressions
 * ----------------------------------------------------------------------------------------
 */
const Expression = ExpressionRule(Select);
const FromList = FromListRule(Select);
const Where = WhereRule(Expression);
const Columns = Node<ColumnsTag>(Brackets(List(Identifier)), (values, $, $next) => {
  return { tag: 'Columns', values, ...context($, $next) };
});
const Default = Node<DefaultTag>(/^DEFAULT/i, (_, $, $next) => ({ tag: 'Default', ...context($, $next) }));

/**
 * Update
 * ----------------------------------------------------------------------------------------
 */

const SetItem = Node<SetItemTag, [IdentifierTag, DefaultTag | ExpressionTag]>(
  All(Identifier, '=', Any(Default, Expression)),
  (values, $, $next) => ({ tag: 'SetItem', values, ...context($, $next) }),
);

const Values = Node<ValuesTag>(Brackets(List(Any(Default, Expression))), (values, $, $next) => {
  return { tag: 'Values', values, ...context($, $next) };
});
const SetList = Node<SetListTag>(List(SetItem), (values, $, $next) => ({
  tag: 'SetList',
  values,
  ...context($, $next),
}));
const SetMap = Node<SetMapTag>(
  All(Columns, '=', Any(All(Optional(/^ROW/i), Values), Brackets(Select))),
  ([columns, value], $, $next) => ({ tag: 'SetMap', columns, value, ...context($, $next) }),
);

const Set = Node<SetTag>(All(/^SET/i, Any(SetList, SetMap)), ([value], $, $next) => ({
  tag: 'Set',
  value,
  ...context($, $next),
}));

const UpdateFrom = Node<UpdateFromTag>(All(/^FROM/i, List(FromList)), (values, $, $next) => {
  return { tag: 'UpdateFrom', values, ...context($, $next) };
});
const ReturningListItem = Node<ReturningListItemTag, [StarIdentifierTag] | [ExpressionTag] | [ExpressionTag, AsTag]>(
  Any(StarIdentifier, All(Any(Expression), Optional(As))),
  (values, $, $next) => ({ tag: 'ReturningListItem', values, ...context($, $next) }),
);
const Returning = Node<ReturningTag>(All(/^RETURNING/i, List(ReturningListItem)), (values, $, $next) => {
  return { tag: 'Returning', values, ...context($, $next) };
});
const Update = Node<UpdateTag>(
  All(
    /^UPDATE/i,
    Optional(/^ONLY/i),
    Table,
    Set,
    Optional(UpdateFrom),
    Optional(Where),
    Optional(Returning),
    Optional(';'),
  ),
  (values, $, $next) => ({ tag: 'Update', values, ...context($, $next) }),
);

/**
 * Delete
 * ----------------------------------------------------------------------------------------
 */
const Using = Node<UsingTag>(All(/^USING/i, List(FromList)), (values, $, $next) => ({
  tag: 'Using',
  values,
  ...context($, $next),
}));
const Delete = Node<DeleteTag>(
  All(/^DELETE FROM/i, Table, Optional(Using), Optional(Where), Optional(Returning), Optional(';')),
  (values, $, $next) => ({ tag: 'Delete', values, ...context($, $next) }),
);

/**
 * Insert
 * ----------------------------------------------------------------------------------------
 */
const Collate = Node<CollateTag>(All(/^COLLATE/i, QuotedName), ([value], $, $next) => ({
  tag: 'Collate',
  value,
  ...context($, $next),
}));
const ConflictTarget = Node<ConflictTargetTag>(
  All(Brackets(List(All(Table, Optional(Brackets(Expression)), Optional(Collate)))), Optional(Where)),
  (values, $, $next) => ({ tag: 'ConflictTarget', values, ...context($, $next) }),
);
const ConflictConstraint = Node<ConflictConstraintTag>(All(/^ON CONSTRAINT/i, Identifier), ([value], $, $next) => {
  return { tag: 'ConflictConstraint', value, ...context($, $next) };
});

const DoNothing = Node<DoNothingTag>(/^DO NOTHING/i, (_, $, $next) => ({ tag: 'DoNothing', ...context($, $next) }));
const DoUpdate = Node<DoUpdateTag>(All(/^DO UPDATE/i, Set, Optional(Where)), ([value, where], $, $next) => {
  return { tag: 'DoUpdate', value, where, ...context($, $next) };
});
const Conflict = Node<ConflictTag>(
  All(
    /^ON CONFLICT/i,
    Any(Any(DoNothing, DoUpdate), All(Any(ConflictTarget, ConflictConstraint), Any(DoNothing, DoUpdate))),
  ),
  (values, $, $next) => ({ tag: 'Conflict', values, ...context($, $next) }),
);

const ValuesList = Node<ValuesListTag>(All(/^VALUES/i, Any(List(Values), Parameter)), (values, $, $next) => {
  return { tag: 'ValuesList', values, ...context($, $next) };
});
const Insert = Node<InsertTag>(
  All(
    /^INSERT INTO/i,
    Table,
    Optional(Columns),
    Any(ValuesList, Select),
    Optional(Conflict),
    Optional(Returning),
    Optional(';'),
  ),
  (values, $, $next) => ({ tag: 'Insert', values, ...context($, $next) }),
);

/**
 * WITH (CTE)
 * ----------------------------------------------------------------------------------------
 */

const Query = Any(Select, Update, Delete, Insert);

const CTE = Node<CTETag, [IdentifierTag, QueryTag]>(All(Identifier, /^AS/, Brackets(Query)), (values, $, $next) => {
  return { tag: 'CTE', values, ...context($, $next) };
});

const With = Node<WithTag, [...CTETag[], QueryTag]>(All(/^WITH/i, List(CTE), Query), (values, $, $next) => {
  return { tag: 'With', values, ...context($, $next) };
});

// Ignore line comments and all whitespace
const IgnoreComments = (node: FunctionRule) => Ignore(/^\s+|^--[^\r\n]*\n/, node);

export const Grammar = IgnoreComments(Any(With, Select, Update, Delete, Insert));
