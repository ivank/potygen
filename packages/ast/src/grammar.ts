import {
  All,
  Any,
  FunctionRule,
  IfNot,
  Ignore,
  LeftBinaryOperator,
  Node,
  Optional,
  Plus,
  Rule,
  Star,
  Y,
} from '@ikerin/rd-parse';
import * as Tag from './grammar.types';

/**
 * A helper function that creates a {@link NodeTag}.
 */
const astNode = <T extends Tag.NodeTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, (values, $, $next) => ({ tag, values, pos: $.pos, nextPos: $next.pos }));

/**
 * A helper function that creates a {@link LeafTag}.
 */
const astLeaf = <T extends Tag.LeafTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value, pos: $.pos, nextPos: $next.pos }));

/**
 * A helper function that creates a {@link EmptyLeafTag}.
 */
const astEmptyLeaf = <T extends Tag.EmptyLeafTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, (_, $, $next) => ({ tag, pos: $.pos, nextPos: $next.pos }));

/**
 * A helper function that creates a {@link LeafTag} and transforms the value to uppercase.
 * Used for various SQL releated tasks that are all uppercased like "DEFAULT", "LEFT JOIN" etc.
 */
const astUpperLeaf = <T extends Tag.LeafTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value: value.toUpperCase(), pos: $.pos, nextPos: $next.pos }));

/**
 * Comma separated list
 */
const List = (item: Rule) => All(item, Star(All(',', item)));

/**
 * Comma separated list with more than one element
 */
const MultiList = (item: Rule) => All(item, Plus(All(',', item)));

/**
 * Put brackets around the rule, e.g. (rule).
 * If rule is missing it'll match empty brackets e.g. ()
 */
const Brackets = (rule?: Rule) => (rule ? All('(', rule, ')') : All('(', ')'));

/**
 * Put square brackets around the rule, e.g. [rule].
 * If rule is missing it'll match empty brackets e.g. []
 */
const SquareBrackets = (rule?: Rule) => (rule ? All('[', rule, ']') : All('[', ']'));

/**
 * Optionally wrap a rule with brackets, or leave it unchanged
 */
const OptionalBrackets = (rule: Rule) => Any(Brackets(rule), rule);

/**
 * Identifier
 */
const NameRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedNameRule = /^"((?:""|[^"])*)"/;

const RestrictedReservedKeywords =
  /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|ABORT|ABSOLUTE|ACCESS|ACTION|ADD|ADMIN|AFTER|AGGREGATE|ALSO|ALTER|ASSERTION|ASSIGNMENT|AT|BACKWARD|BEFORE|BEGIN|BY|CACHE|CALLED|CASCADE|CHAIN|CHARACTERISTICS|CHECKPOINT|CLASS|CLOSE|CLUSTER|COMMENT|COMMIT|COMMITTED|CONNECTION|CONSTRAINTS|CONVERSION|COPY|CREATEDB|CREATEROLE|CREATEUSER|CSV|CURSOR|CYCLE|DATABASE|DAY|DEALLOCATE|DECLARE|DEFAULTS|DEFERRED|DEFINER|DELETE|DELIMITER|DELIMITERS|DISABLE|DOMAIN|DOUBLE|DROP|EACH|ENABLE|ENCODING|ENCRYPTED|ESCAPE|EXCLUDING|EXCLUSIVE|EXECUTE|EXPLAIN|EXTERNAL|FETCH|FIRST|FORCE|FORWARD|FUNCTION|GLOBAL|GRANTED|HANDLER|HEADER|HOLD|HOUR|IMMEDIATE|IMMUTABLE|IMPLICIT|INCLUDING|INCREMENT|INDEX|INHERIT|INHERITS|INPUT|INSENSITIVE|INSERT|INSTEAD|INVOKER|ISOLATION|KEY|LANCOMPILER|LANGUAGE|LARGE|LAST|LEVEL|LISTEN|LOAD|LOCAL|LOCATION|LOCK|LOGIN|MATCH|MAXVALUE|MINUTE|MINVALUE|MODE|MONTH|MOVE|NAMES|NEXT|NO|NOCREATEDB|NOCREATEROLE|NOCREATEUSER|NOINHERIT|NOLOGIN|NOSUPERUSER|NOTHING|NOTIFY|NOWAIT|OBJECT|OF|OIDS|OPERATOR|OPTION|OWNER|PARTIAL|PASSWORD|PREPARE|PREPARED|PRESERVE|PRIOR|PRIVILEGES|PROCEDURAL|PROCEDURE|QUOTE|READ|RECHECK|REINDEX|RELATIVE|RELEASE|RENAME|REPEATABLE|REPLACE|RESET|RESTART|RESTRICT|RETURNS|REVOKE|ROLE|ROLLBACK|ROWS|RULE|SAVEPOINT|SCHEMA|SCROLL|SECOND|SECURITY|SEQUENCE|SERIALIZABLE|SESSION|SET|SHARE|SHOW|SIMPLE|STABLE|START|STATEMENT|STATISTICS|STDIN|STDOUT|STORAGE|STRICT|SUPERUSER|SYSID|SYSTEM|TABLESPACE|TEMP|TEMPLATE|TEMPORARY|TOAST|TRANSACTION|TRIGGER|TRUNCATE|TRUSTED|TYPE|UNCOMMITTED|UNENCRYPTED|UNKNOWN|UNLISTEN|UNTIL|UPDATE|VACUUM|VALID|VALIDATOR|VALUES|VARYING|VIEW|VOLATILE|WITH|WITHOUT|WORK|WRITE|YEAR|ZONE|CROSS|OUTER|RIGHT|LEFT|FULL|JOIN|INNER|RETURNING)$/i;
const ReservedKeywords =
  /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|DER|RETURNING)$/i;

const QuotedIdentifier = astLeaf<Tag.QuotedIdentifierTag>('QuotedIdentifier', QuotedNameRule);
const UnquotedIdentifierRestricted = astLeaf<Tag.UnquotedIdentifierTag>(
  'UnquotedIdentifier',
  IfNot(ReservedKeywords, NameRule),
);
const QuotedIdentifierLessRestricted = astLeaf<Tag.UnquotedIdentifierTag>(
  'UnquotedIdentifier',
  IfNot(RestrictedReservedKeywords, NameRule),
);
const UnquotedIdentifier = astLeaf<Tag.UnquotedIdentifierTag>('UnquotedIdentifier', NameRule);

/**
 * An identifier, but only allows specific names
 */
const SpecificIdentifier = (rule: RegExp) => astLeaf<Tag.UnquotedIdentifierTag>('UnquotedIdentifier', rule);

/**
 * Identifier
 * https://www.postgresql.org/docs/9.1/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 */
const Identifier = Any(UnquotedIdentifier, QuotedIdentifier);
/**
 * Identifier but not a keyword
 * https://www.postgresql.org/docs/9.1/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 */
const IdentifierRestricted = Any(UnquotedIdentifierRestricted, QuotedIdentifier);
/**
 * Identifier but not a keyword
 * https://www.postgresql.org/docs/9.1/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 * https://www.postgresql.org/docs/current/sql-keywords-appendix.html
 */
const IdentifierLessRestricted = Any(QuotedIdentifierLessRestricted, QuotedIdentifier);

const ColumnFullyQualified = astNode<Tag.ColumnTag>('Column', All(Identifier, '.', Identifier, '.', Identifier));
const ColumnQualified = astNode<Tag.ColumnTag>('Column', All(IdentifierRestricted, '.', Identifier));
const ColumnUnqualified = astNode<Tag.ColumnTag>('Column', IdentifierRestricted);

/**
 * Columns with qualifiers
 */
const Column = Any(ColumnFullyQualified, ColumnQualified, ColumnUnqualified);

/**
 * Parameteer
 */
const Parameter = Node<Tag.ParameterTag>(
  All(/^(\$\$|\$|\:)/, NameRule, Optional(Any(/^(\!)/, Brackets(List(UnquotedIdentifier))))),
  ([type, value, ...rest], $, $next) => ({
    tag: 'Parameter',
    value,
    type: type === '$$' ? 'spread' : 'single',
    required: rest.includes('!'),
    pick: rest.filter((item) => item !== '!'),
    pos: $.pos,
    nextPos: $next.pos,
  }),
);

/**
 * AS Clause
 */
const As = astNode<Tag.AsTag>('As', Any(All(/^AS/i, Identifier), IdentifierLessRestricted));

/**
 * Constant
 */
const Null = astEmptyLeaf<Tag.NullTag>('Null', /^NULL/i);
const IntegerRule = /^([0-9]+)/;
const NumberRule = Any(
  IntegerRule,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = astLeaf<Tag.StringTag>('String', /^'((?:''|[^'])*)'/);
const EscapeString = astLeaf<Tag.EscapeStringTag>('EscapeString', All(/^E/i, String));
const HexademicalString = astLeaf<Tag.HexademicalStringTag>('HexademicalString', All(/^X/i, String));
const BitString = astLeaf<Tag.BitStringTag>('BitString', All(/^B/i, String));
const DollarQuatedString = astLeaf<Tag.DollarQuotedStringTag>('DollarQuotedString', /^\$\$((?:\$\$|.)*)\$\$/);
const CustomDollarQuatedString = Node<Tag.CustomQuotedStringTag>(
  /^\$(?<delimiter>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<delimiter>\$/i,
  ([delimiter, value], $, $next) => ({ tag: 'CustomQuotedString', value, delimiter, pos: $.pos, nextPos: $next.pos }),
);
const Integer = astLeaf<Tag.IntegerTag>('Integer', IntegerRule);
const Number = astLeaf<Tag.NumberTag>('Number', NumberRule);
const Boolean = astUpperLeaf<Tag.BooleanTag>('Boolean', /^(TRUE|FALSE)/i);

const AllTypesRule =
  /^(xml|xid|void|varchar|varbit|uuid|unknown|txid_snapshot|tsvector|tstzrange|tsrange|tsm_handler|trigger|tinterval|timetz|timestamptz|timestamp without time zone|timestamp with time zone|timestamp|time without time zone|time with time zone|time|tid|text|smgr|smallserial|smallint|serial|reltime|regtype|regrole|regprocedure|regproc|regoperator|regoper|regnamespace|regdictionary|regconfig|regclass|refcursor|record|real|query|polygon|point|pg_lsn|pg_ddl_command|path|opaque|oid|numeric|name|mrange|money|macaddr8|macaddr|lseg|line|language_handler|jsonb|json|interval|internal|integer|int8range|int8|int4range|int4|int2vector|int2|int|inet|index_am_handler|float8|float4|fdw_handler|event_trigger|double precision|daterange|date|cstring|circle|cidr|cid|character varying|character|char|bytea|bpchar|box|boolean|bool|bit varying|bit|bigserial|bigint|aclitem|abstime)/i;

const ConstantType = astUpperLeaf<Tag.ConstantTypeTag>('ConstantType', AllTypesRule);

const TypedConstant = astNode<Tag.TypedConstantTag>(
  'TypedConstant',
  All(ConstantType, Any(String, EscapeString, HexademicalString, BitString)),
);
const Constant = Any(
  String,
  DollarQuatedString,
  CustomDollarQuatedString,
  Number,
  Boolean,
  EscapeString,
  HexademicalString,
  BitString,
  TypedConstant,
);

/**
 * Type
 */
const SingleParamTypeRule =
  /^(bit varying|varbit|bit|character varying|varchar|character|char|interval|timestamptz|timestamp|timetz|time)/i;
const DoubleParamTypeRule = /^(numeric|decimal)/i;

const TypeIdentifier = (rule: RegExp) =>
  astNode<Tag.QualifiedIdentifierTag>('QualifiedIdentifier', Any(SpecificIdentifier(rule), QuotedIdentifier));

const TypeQualifiedIdentifier = (rule: RegExp) => {
  const IdentifierNode = Any(SpecificIdentifier(rule), QuotedIdentifier);
  return astNode<Tag.QualifiedIdentifierTag>(
    'QualifiedIdentifier',
    Any(All(SpecificIdentifier(NameRule), '.', IdentifierNode), IdentifierNode),
  );
};

const Type = astNode<Tag.TypeTag>(
  'Type',
  Any(
    All(TypeIdentifier(DoubleParamTypeRule), Brackets(Any(All(IntegerRule, ',', IntegerRule), IntegerRule))),
    All(TypeIdentifier(SingleParamTypeRule), Brackets(IntegerRule)),
    TypeIdentifier(AllTypesRule),
    TypeQualifiedIdentifier(NameRule),
  ),
);
const Dimension = astEmptyLeaf<Tag.DimensionTag>('Dimension', SquareBrackets());
const TypeArray = astNode<Tag.TypeArrayTag>('TypeArray', All(Type, Plus(Dimension)));
const AnyType = Any(TypeArray, Type);

/**
 * Count
 */
const CastableRule = (DataType: Rule) =>
  Node<Tag.CastableDataTypeTag>(All(DataType, Optional(All('::', AnyType))), ([value, type], $, $next) => {
    return type ? { tag: 'PgCast', values: [value, type], pos: $.pos, nextPos: $next.pos } : value;
  });

const Count = astNode<Tag.CountTag>('Count', CastableRule(Any(Integer, Parameter)));

/**
 * Table
 */
const QualifiedIdentifier = astNode<Tag.QualifiedIdentifierTag>(
  'QualifiedIdentifier',
  Any(All(Identifier, '.', Identifier), IdentifierRestricted),
);
const Table = astNode<Tag.TableTag>('Table', All(QualifiedIdentifier, Optional(As)));

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, Brackets(List(Column)));
const Distinct = astNode<Tag.DistinctTag>('Distinct', All(/^DISTINCT/i, Optional(DistinctOnList)));

const StarSql = astEmptyLeaf<Tag.StarTag>('Star', '*');
const StarIdentifier = Any(
  astNode<Tag.StarIdentifierTag>('StarIdentifier', All(Identifier, '.', Identifier, '.', StarSql)),
  astNode<Tag.StarIdentifierTag>('StarIdentifier', All(Identifier, '.', StarSql)),
  astNode<Tag.StarIdentifierTag>('StarIdentifier', StarSql),
);

const UnaryOperator = /^(\+|\-|NOT|ISNULL|NOTNULL)/i;

const BinaryOperator = [
  /^(\^)/,
  /^(\*|\/|%)/,
  /^(\+|-)/,
  /^(IS NOT DISTINCT FROM|IS DISTINCT FROM|IS|AT TIME ZONE)/i,
  /^(->>|->|#>>|#>|@>|<@|\?\||\?\&|\?|#-|!!|<->)/,
  /^(\|\|)/,
  /^(\|)/,
  /^(\&)/,
  /^(\#)/,
  /^(\!\~\*|\!\~|\~\*|\~)/,
  /^(<<)/,
  /^(>>)/,
  /^(@@)/,
  /^(OVERLAPS|IN)/i,
  /^(LIKE|ILIKE)/i,
  /^(<=|>=|<|>)/,
  /^(<>|!=|=)/,
  /^(AND)/i,
  /^(OR)/i,
];

const TernaryOperator = [[/^(BETWEEN|NOT BETWEEN|BETWEEN SYMMETRIC|NOT BETWEEN SYMMETRIC)/i, /^(AND)/i]];

/**
 * Order
 * ----------------------------------------------------------------------------------------
 */
const OrderRule = (Expression: Rule): Rule => {
  const OrderDirection = astLeaf<Tag.OrderDirectionTag>('OrderDirection', /^(ASC|DESC|USNIG >|USING <)/i);
  const OrderByItem = astNode<Tag.OrderByItemTag>('OrderByItem', All(Expression, Optional(OrderDirection)));
  return astNode<Tag.OrderByTag>('OrderBy', All(/^ORDER BY/i, List(OrderByItem)));
};

const ExpressionRule = (SelectExpression: Rule): Rule =>
  Y((ChildExpression) => {
    const ArrayConstructor = astNode<Tag.ArrayConstructorTag>(
      'ArrayConstructor',
      All(/^ARRAY/i, SquareBrackets(List(ChildExpression))),
    );
    const ExpressionList = astNode<Tag.ExpressionListTag>('ExpressionList', List(ChildExpression));

    /**
     * Comparation Expression
     * ----------------------------------------------------------------------------------------
     */

    const ComparationTypeExists = astUpperLeaf<Tag.ComparationTypeTag>('ComparationType', /^(EXISTS)/i);
    const ComparationTypeInclusion = astUpperLeaf<Tag.ComparationTypeTag>('ComparationType', /^(IN|NOT IN)/i);
    const ComparationTypeOperator = astUpperLeaf<Tag.ComparationTypeTag>('ComparationType', /^(ANY|SOME|ALL)/i);

    const Exists = astNode<Tag.ComparationExpressionTag>(
      'ComparationExpression',
      All(ComparationTypeExists, Brackets(SelectExpression)),
    );
    const InclusionComparation = astNode<Tag.ComparationExpressionTag>(
      'ComparationExpression',
      All(Column, ComparationTypeInclusion, Brackets(SelectExpression)),
    );

    const ComparationOperator = astUpperLeaf<Tag.ComparationOperatorTag>(
      'ComparationOperator',
      /^(<=|>=|<|>|<>|!=|=|AND|OR)/,
    );

    const OperatorComparation = astNode<Tag.ComparationExpressionTag>(
      'ComparationExpression',
      All(
        Column,
        ComparationOperator,
        ComparationTypeOperator,
        Brackets(Any(ArrayConstructor, SelectExpression, ExpressionList)),
      ),
    );

    const RowWiseComparation = astNode<Tag.ComparationExpressionTag>(
      'ComparationExpression',
      All(Column, ComparationOperator, Brackets(SelectExpression)),
    );

    /**
     * Function
     * ----------------------------------------------------------------------------------------
     */
    const FunctionDistinct = astNode<Tag.DistinctTag>('Distinct', /^DISTINCT/i);
    const FunctionFilter = astNode<Tag.FilterTag>('Filter', All(/^FILTER/i, Brackets(WhereRule(ChildExpression))));
    const FunctionIdentifier = astNode<Tag.QualifiedIdentifierTag>(
      'QualifiedIdentifier',
      Any(All(Identifier, '.', Identifier), Identifier),
    );
    const Function = astNode<Tag.FunctionTag>(
      'Function',
      Any(
        astNode<Tag.QualifiedIdentifierTag>(
          'QualifiedIdentifier',
          SpecificIdentifier(/^(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)/i),
        ),
        All(
          FunctionIdentifier,
          Any(
            Brackets(),
            Brackets(
              List(
                All(
                  Optional(FunctionDistinct),
                  Any(StarIdentifier, ChildExpression),
                  Optional(OrderRule(ChildExpression)),
                ),
              ),
            ),
          ),
          Optional(FunctionFilter),
        ),
      ),
    );

    const ArrayIndexRange = astNode<Tag.ArrayIndexRangeTag>(
      'ArrayIndexRange',
      All(ChildExpression, ':', ChildExpression),
    );
    const ArrayIndex = astNode<Tag.ArrayIndexTag>(
      'ArrayIndex',
      All(Any(Column, Brackets(ChildExpression)), SquareBrackets(Any(ArrayIndexRange, ChildExpression))),
    );
    const CompositeAccess = astNode<Tag.CompositeAccessTag>(
      'CompositeAccess',
      All(Brackets(ChildExpression), '.', Identifier),
    );

    const Row = astNode<Tag.RowTag>(
      'Row',
      Any(All(/^ROW/i, Brackets(List(ChildExpression))), Brackets(MultiList(ChildExpression))),
    );

    const ExtractField = astLeaf<Tag.ExtractFieldTag>(
      'ExtractField',
      /^(century|day|decade|dow|doy|epoch|hour|isodow|isoyear|julian|microseconds|millennium|milliseconds|minute|month|quarter|second|timezone|timezone_hour|timezone_minute|week|year)/i,
    );
    const Extract = astNode<Tag.ExtractTag>(
      'Extract',
      All(/^EXTRACT/i, Brackets(All(ExtractField, /^FROM/i, ChildExpression))),
    );

    const WrappedExpression = astNode<Tag.WrappedExpressionTag>('WrappedExpression', Brackets(ChildExpression));

    /**
     * PgCast
     * ----------------------------------------------------------------------------------------
     */
    const DataType = Any(
      OperatorComparation,
      ColumnFullyQualified,
      Constant,
      Parameter,
      ArrayConstructor,
      Row,
      Exists,
      Extract,
      Function,
      ArrayIndex,
      ColumnQualified,
      Null,
      InclusionComparation,
      CompositeAccess,
      RowWiseComparation,
      ColumnUnqualified,
      Brackets(SelectExpression),
      WrappedExpression,
    );
    /**
     * Cast
     * ----------------------------------------------------------------------------------------
     */
    const Cast = astNode<Tag.CastTag>('Cast', All(/^CAST/i, Brackets(All(DataType, /^AS/i, AnyType))));
    const CastableDataType = CastableRule(DataType);

    /**
     * Case
     * ----------------------------------------------------------------------------------------
     */
    const When = astNode<Tag.WhenTag>('When', All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression));
    const Else = astNode<Tag.ElseTag>('Else', All(/^ELSE/i, ChildExpression));
    const CaseSimple = astNode<Tag.CaseSimpleTag>(
      'CaseSimple',
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
    );
    const CaseNormal = astNode<Tag.CaseTag>('Case', All(/^CASE/i, Plus(When), Optional(Else), /^END/i));

    const DataExpression = CastableRule(Any(CaseNormal, CaseSimple, CastableDataType));

    /**
     * Unary Operator
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = astUpperLeaf<Tag.UnaryOperatorTag>('UnaryOperator', UnaryOperator);
    const UnaryExpression = Node<Tag.UnaryExpressionTag>(
      All(Star(UnaryOperatorNode), DataExpression),
      (parts, $, $next) =>
        parts.reduceRight((value, operator) => {
          return { tag: 'UnaryExpression', values: [operator, value], pos: $.pos, nextPos: $next.pos };
        }),
    );

    /**
     * Binary Operator
     * ----------------------------------------------------------------------------------------
     */
    const BinaryExpression = BinaryOperator.reduce((Current, Operator) => {
      const OperatorNode = astUpperLeaf<Tag.BinaryOperatorTag>('BinaryOperator', Operator);
      return Node<Tag.BinaryExpressionTag, any>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator((values, $, $next) => ({ tag: 'BinaryExpression', values, pos: $.pos, nextPos: $next.pos })),
      );
    }, UnaryExpression);

    /**
     * Ternary Operator
     * ----------------------------------------------------------------------------------------
     */
    const TernaryExpression = TernaryOperator.reduce((Current, [Operator, Separator]) => {
      const OperatorNode = astUpperLeaf<Tag.TernaryOperatorTag>('TernaryOperator', Operator);
      const SeparatorNode = astUpperLeaf<Tag.TernarySeparatorTag>('TernarySeparator', Separator);
      return astNode<Tag.TernaryExpressionTag>(
        'TernaryExpression',
        All(Current, OperatorNode, Current, SeparatorNode, Current),
      );
    }, DataExpression);

    return Any(Cast, TernaryExpression, BinaryExpression);
  });

const FromListRule = (Select: Rule): Rule => {
  const NamedSelect = astNode<Tag.NamedSelectTag>('NamedSelect', All(Brackets(Select), As));
  return astNode<Tag.FromListTag>('FromList', List(Any(Table, NamedSelect)));
};

const WhereRule = (Expression: Rule): Rule => astNode<Tag.WhereTag>('Where', All(/^WHERE/i, Expression));

const Select = Y((SelectExpression) => {
  const Expression = ExpressionRule(SelectExpression);

  const SelectListItem = astNode<Tag.SelectListItemTag>(
    'SelectListItem',
    Any(StarIdentifier, All(Any(Expression), Optional(As))),
  );
  const SelectList = astNode<Tag.SelectListTag>('SelectList', List(SelectListItem));

  /**
   * From
   * ----------------------------------------------------------------------------------------
   */
  const FromList = FromListRule(SelectExpression);

  const JoinType = astUpperLeaf(
    'JoinType',
    /^(JOIN|INNER JOIN|LEFT JOIN|LEFT OUTER JOIN|RIGHT JOIN|RIGHT OUTER JOIN|FULL JOIN|FULL OUTER JOIN|CROSS JOIN)/i,
  );
  const JoinOn = astNode<Tag.JoinOnTag>('JoinOn', All(/^ON/i, Expression));
  const JoinUsing = astNode<Tag.JoinUsingTag>('JoinUsing', All(/^USING/i, List(Column)));

  const Join = Y((ChildJoin) => {
    const InnerTableWithJoin = astNode<Tag.TableWithJoinTag>('TableWithJoin', Brackets(All(Table, Star(ChildJoin))));
    return astNode<Tag.JoinTag>(
      'Join',
      All(JoinType, Any(Table, InnerTableWithJoin), Optional(Any(JoinOn, JoinUsing))),
    );
  });
  const TableWithJoin = Y((Child) =>
    astNode<Tag.TableWithJoinTag>('TableWithJoin', Brackets(All(Any(Table, Child), Star(Join)))),
  );

  const From = astNode<Tag.FromTag>('From', All(/^FROM/i, Any(All(FromList, Star(Join)), TableWithJoin)));

  /**
   * Where
   * ----------------------------------------------------------------------------------------
   */
  const Where = WhereRule(Expression);

  /**
   * Group By
   * ----------------------------------------------------------------------------------------
   */
  const GroupBy = astNode<Tag.GroupByTag>('GroupBy', All(/^GROUP BY/i, OptionalBrackets(List(Column))));

  /**
   * Having
   * ----------------------------------------------------------------------------------------
   */
  const Having = astNode<Tag.HavingTag>('Having', All(/^HAVING/i, Expression));

  /**
   * Select Parts
   * ----------------------------------------------------------------------------------------
   */
  const SelectParts = [
    Optional(Any(/^ALL /i, Distinct)),
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
  const CombinationType = astUpperLeaf<Tag.CombinationTypeTag>(
    'CombinationType',
    /^(UNION ALL|INTERSECT ALL|EXCEPT ALL|UNION|INTERSECT|EXCEPT)/i,
  );
  const Combination = astNode<Tag.CombinationTag>('Combination', All(CombinationType, /^SELECT/i, ...SelectParts));

  /**
   * Order
   * ----------------------------------------------------------------------------------------
   */
  const OrderBy = OrderRule(Expression);

  /**
   * Limit
   * ----------------------------------------------------------------------------------------
   */
  const LimitAll = astEmptyLeaf<Tag.LimitAllTag>('LimitAll', /^ALL/i);
  const Limit = astNode<Tag.LimitTag>('Limit', All(/^LIMIT/i, Any(Count, LimitAll)));
  const Offset = astNode<Tag.OffsetTag>('Offset', All(/^OFFSET/i, Count));

  return astNode<Tag.SelectTag>(
    'Select',
    All(
      /^SELECT/i,
      ...SelectParts,
      Star(Combination),
      Optional(OrderBy),
      Optional(Any(All(Limit, Offset), All(Offset, Limit), Limit, Offset)),
      Optional(';'),
    ),
  );
});

/**
 * Expressions
 * ----------------------------------------------------------------------------------------
 */
const Expression = ExpressionRule(Select);
const FromList = FromListRule(Select);
const Where = WhereRule(Expression);
const Columns = astNode<Tag.ColumnsTag>('Columns', Brackets(List(IdentifierRestricted)));
const Default = astEmptyLeaf<Tag.DefaultTag>('Default', /^DEFAULT/i);

/**
 * Update
 * ----------------------------------------------------------------------------------------
 */

const SetItem = astNode<Tag.SetItemTag>('SetItem', All(Identifier, '=', Any(Default, Expression)));
const Values = astNode<Tag.ValuesTag>('Values', Brackets(List(Any(Default, Expression))));
const SetList = astNode<Tag.SetListTag>('SetList', List(SetItem));
const SetMap = astNode<Tag.SetMapTag>(
  'SetMap',
  All(Columns, '=', Any(All(Optional(/^ROW/i), Values), Brackets(Select))),
);
const Set = astNode<Tag.SetTag>('Set', All(/^SET/i, Any(SetList, SetMap)));

const UpdateFrom = astNode<Tag.UpdateFromTag>('UpdateFrom', All(/^FROM/i, List(FromList)));
const ReturningListItem = astNode<Tag.ReturningListItemTag>(
  'ReturningListItem',
  Any(StarIdentifier, All(Any(Expression), Optional(As))),
);
const Returning = astNode<Tag.ReturningTag>('Returning', All(/^RETURNING/i, List(ReturningListItem)));
const Update = astNode<Tag.UpdateTag>(
  'Update',
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
);

/**
 * Delete
 * ----------------------------------------------------------------------------------------
 */
const Using = astNode<Tag.UsingTag>('Using', All(/^USING/i, List(FromList)));
const Delete = astNode<Tag.DeleteTag>(
  'Delete',
  All(/^DELETE FROM/i, Table, Optional(Using), Optional(Where), Optional(Returning), Optional(';')),
);

/**
 * Insert
 * ----------------------------------------------------------------------------------------
 */
const Collate = astLeaf<Tag.CollateTag>('Collate', All(/^COLLATE/i, QuotedNameRule));
const ConflictTarget = astNode<Tag.ConflictTargetTag>(
  'ConflictTarget',
  All(Brackets(List(All(Column, Optional(Brackets(Expression)), Optional(Collate)))), Optional(Where)),
);
const ConflictConstraint = astLeaf<Tag.ConflictConstraintTag>('ConflictConstraint', All(/^ON CONSTRAINT/i, Identifier));

const DoNothing = astEmptyLeaf<Tag.DoNothingTag>('DoNothing', /^DO NOTHING/i);
const DoUpdate = astNode<Tag.DoUpdateTag>('DoUpdate', All(/^DO UPDATE/i, Set, Optional(Where)));
const Conflict = astNode<Tag.ConflictTag>(
  'Conflict',
  All(
    /^ON CONFLICT/i,
    Any(Any(DoNothing, DoUpdate), All(Any(ConflictTarget, ConflictConstraint), Any(DoNothing, DoUpdate))),
  ),
);

const ValuesList = astNode<Tag.ValuesListTag>('ValuesList', All(/^VALUES/i, Any(List(Values), Parameter)));
const Insert = astNode<Tag.InsertTag>(
  'Insert',
  All(
    /^INSERT INTO/i,
    Table,
    Optional(Columns),
    Any(ValuesList, Select),
    Optional(Conflict),
    Optional(Returning),
    Optional(';'),
  ),
);

/**
 * WITH (CTE)
 * ----------------------------------------------------------------------------------------
 */

const Query = Any(Select, Update, Delete, Insert);
const CTEName = astNode<Tag.CTENameTag>('CTEName', All(Identifier, Optional(Columns)));
const CTEValues = astNode<Tag.CTEValuesTag>('CTEValues', Brackets(List(Expression)));
const CTEValuesList = astNode<Tag.CTEValuesListTag>('CTEValuesList', All(/^VALUES/i, Any(List(CTEValues), Parameter)));
const CTE = astNode<Tag.CTETag>('CTE', All(CTEName, /^AS/, Brackets(Any(Query, CTEValuesList))));
const With = astNode<Tag.WithTag>('With', All(/^WITH/i, List(CTE), Query));

/**
 * Transaction
 * ----------------------------------------------------------------------------------------
 */

const Begin = astEmptyLeaf<Tag.BeginTag>('Begin', All(/^BEGIN/i, Optional(';')));
const Savepoint = astNode<Tag.SavepointTag>('Savepoint', All(/^SAVEPOINT/i, Identifier, Optional(';')));
const Commit = astEmptyLeaf<Tag.CommitTag>('Commit', All(/^COMMIT/i, Optional(';')));
const Rollback = astNode<Tag.RollbackTag>(
  'Rollback',
  All(/^ROLLBACK/i, Optional(All(/^TO/i, Identifier)), Optional(';')),
);

// Ignore line comments and all whitespace
const IgnoreComments = (node: FunctionRule) => Ignore(/^\s+|^--[^\r\n]*\n/, node);

export const Grammar = IgnoreComments(Any(With, Select, Update, Delete, Insert, Begin, Savepoint, Commit, Rollback));
