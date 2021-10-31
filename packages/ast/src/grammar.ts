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
import {
  BinaryExpressionTag,
  CastableDataTypeTag,
  ParameterTag,
  CustomQuotedStringTag,
  UnaryExpressionTag,
  NodeTag,
  EmptyLeafTag,
  LeafTag,
} from './grammar.types';

const astNode = (tag: NodeTag['tag'], rule: Rule) =>
  Node(rule, (values, $, $next) => ({ tag, values, pos: $.pos, nextPos: $next.pos }));

const astLeaf = (tag: LeafTag['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value, pos: $.pos, nextPos: $next.pos }));

const astEmptyLeaf = (tag: EmptyLeafTag['tag'], rule: Rule) =>
  Node(rule, (_, $, $next) => ({ tag, pos: $.pos, nextPos: $next.pos }));

const astUpperLeaf = (tag: LeafTag['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value: value.toUpperCase(), pos: $.pos, nextPos: $next.pos }));

/**
 * Comma separated list
 */
const List = (item: Rule) => All(item, Star(All(',', item)));

/**
 * Comma separated list with more than one element
 */
const MultiList = (item: Rule) => All(item, Plus(All(',', item)));

const Brackets = (rule?: Rule) => (rule ? All('(', rule, ')') : All('(', ')'));
const SquareBrackets = (rule?: Rule) => (rule ? All('[', rule, ']') : All('[', ']'));
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

const QuotedIdentifier = astLeaf('QuotedIdentifier', QuotedNameRule);
const UnquotedIdentifierRestricted = astLeaf('UnquotedIdentifier', IfNot(ReservedKeywords, NameRule));
const QuotedIdentifierLessRestricted = astLeaf('UnquotedIdentifier', IfNot(RestrictedReservedKeywords, NameRule));
const UnquotedIdentifier = astLeaf('UnquotedIdentifier', NameRule);
const SpecificIdentifier = (rule: RegExp) => astLeaf('UnquotedIdentifier', rule);

const Identifier = Any(UnquotedIdentifier, QuotedIdentifier);
const IdentifierRestricted = Any(UnquotedIdentifierRestricted, QuotedIdentifier);
const IdentifierLessRestricted = Any(QuotedIdentifierLessRestricted, QuotedIdentifier);

const ColumnFullyQualified = astNode('Column', All(Identifier, '.', Identifier, '.', Identifier));
const ColumnQualified = astNode('Column', All(Identifier, '.', Identifier));
const ColumnUnqualified = astNode('Column', IdentifierRestricted);

const Column = Any(ColumnFullyQualified, ColumnQualified, ColumnUnqualified);

/**
 * Parameteer
 */
const Parameter = Node<ParameterTag>(
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
const As = astNode('As', Any(All(/^AS/i, Identifier), IdentifierLessRestricted));

/**
 * Constant
 */
const Null = astEmptyLeaf('Null', /^NULL/i);
const IntegerRule = /^([0-9]+)/;
const NumberRule = Any(
  IntegerRule,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const String = astLeaf('String', /^'((?:''|[^'])*)'/);
const EscapeString = astLeaf('EscapeString', All(/^E/i, String));
const HexademicalString = astLeaf('HexademicalString', All(/^X/i, String));
const BitString = astLeaf('BitString', All(/^B/i, String));
const DollarQuatedString = astLeaf('DollarQuotedString', /^\$\$((?:\$\$|.)*)\$\$/);
const CustomDollarQuatedString = Node<CustomQuotedStringTag>(
  /^\$(?<delimiter>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<delimiter>\$/i,
  ([delimiter, value], $, $next) => ({ tag: 'CustomQuotedString', value, delimiter, pos: $.pos, nextPos: $next.pos }),
);
const Integer = astLeaf('Integer', IntegerRule);
const Number = astLeaf('Number', NumberRule);
const Boolean = astUpperLeaf('Boolean', /^(TRUE|FALSE)/i);

const AllTypesRule =
  /^(xml|xid|void|varchar|varbit|uuid|unknown|txid_snapshot|tsvector|tstzrange|tsrange|tsm_handler|trigger|tinterval|timetz|timestamptz|timestamp without time zone|timestamp with time zone|timestamp|time without time zone|time with time zone|time|tid|text|smgr|smallserial|smallint|serial|reltime|regtype|regrole|regprocedure|regproc|regoperator|regoper|regnamespace|regdictionary|regconfig|regclass|refcursor|record|real|query|polygon|point|pg_lsn|pg_ddl_command|path|opaque|oid|numeric|name|mrange|money|macaddr8|macaddr|lseg|line|language_handler|jsonb|json|interval|internal|integer|int8range|int8|int4range|int4|int2vector|int2|int|inet|index_am_handler|float8|float4|fdw_handler|event_trigger|double precision|daterange|date|cstring|circle|cidr|cid|character varying|character|char|bytea|bpchar|box|boolean|bool|bit varying|bit|bigserial|bigint|aclitem|abstime)/i;

const ConstantType = astUpperLeaf('ConstantType', AllTypesRule);

const TypedConstant = astNode(
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

const Type = astNode(
  'Type',
  Any(
    All(
      SpecificIdentifier(DoubleParamTypeRule),
      Optional(Brackets(Any(All(IntegerRule, ',', IntegerRule), IntegerRule))),
    ),
    All(SpecificIdentifier(SingleParamTypeRule), Optional(Brackets(IntegerRule))),
    SpecificIdentifier(AllTypesRule),
    SpecificIdentifier(NameRule),
  ),
);
const Dimension = astEmptyLeaf('Dimension', SquareBrackets());
const TypeArray = astNode('TypeArray', All(Type, Plus(Dimension)));
const AnyType = Any(TypeArray, Type);

/**
 * Count
 */
const CastableRule = (DataType: Rule) =>
  Node<CastableDataTypeTag>(All(DataType, Optional(All('::', AnyType))), ([value, type], $, $next) => {
    return type ? { tag: 'PgCast', values: [value, type], pos: $.pos, nextPos: $next.pos } : value;
  });

const Count = astNode('Count', CastableRule(Any(Integer, Parameter)));

/**
 * Table
 */
const TableIdentifier = astNode('TableIdentifier', Any(All(Identifier, '.', Identifier), IdentifierRestricted));
const Table = astNode('Table', All(TableIdentifier, Optional(As)));

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, Brackets(List(Column)));
const Distinct = astNode('Distinct', All(/^DISTINCT/i, Optional(DistinctOnList)));

const StarSql = astEmptyLeaf('Star', '*');
const StarIdentifier = Any(
  astNode('StarIdentifier', All(Identifier, '.', Identifier, '.', StarSql)),
  astNode('StarIdentifier', All(Identifier, '.', StarSql)),
  astNode('StarIdentifier', StarSql),
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
  /^(\~)/,
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
  const OrderDirection = astLeaf('OrderDirection', /^(ASC|DESC|USNIG >|USING <)/i);
  const OrderByItem = astNode('OrderByItem', All(Expression, Optional(OrderDirection)));
  return astNode('OrderBy', All(/^ORDER BY/i, List(OrderByItem)));
};

const ExpressionRule = (SelectExpression: Rule): Rule =>
  Y((ChildExpression) => {
    const ArrayConstructor = astNode('ArrayConstructor', All(/^ARRAY/i, SquareBrackets(List(ChildExpression))));
    const ExpressionList = astNode('ExpressionList', List(ChildExpression));

    /**
     * Comparation Expression
     * ----------------------------------------------------------------------------------------
     */

    const ComparationTypeExists = astUpperLeaf('ComparationType', /^(EXISTS)/i);
    const ComparationTypeInclusion = astUpperLeaf('ComparationType', /^(IN|NOT IN)/i);
    const ComparationTypeOperator = astUpperLeaf('ComparationType', /^(ANY|SOME|ALL)/i);

    const Exists = astNode('ComparationExpression', All(ComparationTypeExists, Brackets(SelectExpression)));
    const InclusionComparation = astNode(
      'ComparationExpression',
      All(Column, ComparationTypeInclusion, Brackets(SelectExpression)),
    );

    const ComparationOperator = astUpperLeaf('ComparationOperator', /^(<=|>=|<|>|<>|!=|=|AND|OR)/);

    const OperatorComparation = astNode(
      'ComparationExpression',
      All(
        Column,
        ComparationOperator,
        ComparationTypeOperator,
        Brackets(Any(ArrayConstructor, SelectExpression, ExpressionList)),
      ),
    );

    const RowWiseComparation = astNode(
      'ComparationExpression',
      All(Column, ComparationOperator, Brackets(SelectExpression)),
    );

    /**
     * Function
     * ----------------------------------------------------------------------------------------
     */
    const FunctionDistinct = astNode('Distinct', /^DISTINCT/i);
    const FunctionFilter = astNode('Filter', All(/^FILTER/i, Brackets(WhereRule(ChildExpression))));
    const Function = astNode(
      'Function',
      Any(
        SpecificIdentifier(/^(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)/i),
        All(
          Identifier,
          Any(
            Brackets(),
            Brackets(List(All(Optional(FunctionDistinct), ChildExpression, Optional(OrderRule(ChildExpression))))),
          ),
          Optional(FunctionFilter),
        ),
      ),
    );

    const ArrayIndexRange = astNode('ArrayIndexRange', All(ChildExpression, ':', ChildExpression));
    const ArrayIndex = astNode(
      'ArrayIndex',
      All(Any(Column, Brackets(ChildExpression)), SquareBrackets(Any(ArrayIndexRange, ChildExpression))),
    );

    const Row = astNode(
      'Row',
      Any(All(/^ROW/i, Brackets(List(ChildExpression))), Brackets(MultiList(ChildExpression))),
    );

    const ExtractField = astLeaf(
      'ExtractField',
      /^(century|day|decade|dow|doy|epoch|hour|isodow|isoyear|julian|microseconds|millennium|milliseconds|minute|month|quarter|second|timezone|timezone_hour|timezone_minute|week|year)/i,
    );
    const Extract = astNode('Extract', All(/^EXTRACT/i, Brackets(All(ExtractField, /^FROM/i, ChildExpression))));

    const WrappedExpression = astNode('WrappedExpression', Brackets(ChildExpression));

    /**
     * PgCast
     * ----------------------------------------------------------------------------------------
     */
    const DataType = Any(
      OperatorComparation,
      ColumnFullyQualified,
      ColumnQualified,
      Constant,
      Parameter,
      ArrayConstructor,
      Row,
      Exists,
      Extract,
      Function,
      Null,
      InclusionComparation,
      ArrayIndex,
      RowWiseComparation,
      ColumnUnqualified,
      Brackets(SelectExpression),
      WrappedExpression,
    );
    /**
     * Cast
     * ----------------------------------------------------------------------------------------
     */
    const Cast = astNode('Cast', All(/^CAST/i, Brackets(All(DataType, /^AS/i, AnyType))));
    const CastableDataType = CastableRule(DataType);

    /**
     * Case
     * ----------------------------------------------------------------------------------------
     */
    const When = astNode('When', All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression));
    const Else = astNode('Else', All(/^ELSE/i, ChildExpression));
    const CaseSimple = astNode('CaseSimple', All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i));
    const CaseNormal = astNode('Case', All(/^CASE/i, Plus(When), Optional(Else), /^END/i));

    const DataExpression = Any(CaseNormal, CaseSimple, CastableDataType);

    /**
     * Unary Operator
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = astUpperLeaf('UnaryOperator', UnaryOperator);
    const UnaryExpression = Node<UnaryExpressionTag>(All(Star(UnaryOperatorNode), DataExpression), (parts, $, $next) =>
      parts.reduceRight((value, operator) => {
        return { tag: 'UnaryExpression', values: [operator, value], pos: $.pos, nextPos: $next.pos };
      }),
    );

    /**
     * Binary Operator
     * ----------------------------------------------------------------------------------------
     */
    const BinaryExpression = BinaryOperator.reduce((Current, Operator) => {
      const OperatorNode = astUpperLeaf('BinaryOperator', Operator);
      return Node<BinaryExpressionTag, any>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator((values, $, $next) => ({ tag: 'BinaryExpression', values, pos: $.pos, nextPos: $next.pos })),
      );
    }, UnaryExpression);

    /**
     * Ternary Operator
     * ----------------------------------------------------------------------------------------
     */
    const TernaryExpression = TernaryOperator.reduce((Current, [Operator, Separator]) => {
      const OperatorNode = astUpperLeaf('TernaryOperator', Operator);
      const SeparatorNode = astUpperLeaf('TernarySeparator', Separator);
      return astNode('TernaryExpression', All(Current, OperatorNode, Current, SeparatorNode, Current));
    }, DataExpression);

    return Any(Cast, TernaryExpression, BinaryExpression);
  });

const FromListRule = (Select: Rule): Rule => {
  const NamedSelect = astNode('NamedSelect', All(Brackets(Select), As));
  return astNode('FromList', List(Any(Table, NamedSelect)));
};

const WhereRule = (Expression: Rule): Rule => astNode('Where', All(/^WHERE/i, Expression));

const Select = Y((SelectExpression) => {
  const Expression = ExpressionRule(SelectExpression);

  const SelectListItem = astNode('SelectListItem', Any(StarIdentifier, All(Any(Expression), Optional(As))));
  const SelectList = astNode('SelectList', List(SelectListItem));

  /**
   * From
   * ----------------------------------------------------------------------------------------
   */
  const FromList = FromListRule(SelectExpression);

  const JoinType = astUpperLeaf(
    'JoinType',
    /^(JOIN|INNER JOIN|LEFT JOIN|LEFT OUTER JOIN|RIGHT JOIN|RIGHT OUTER JOIN|FULL JOIN|FULL OUTER JOIN|CROSS JOIN)/i,
  );
  const JoinOn = astNode('JoinOn', All(/^ON/i, Expression));
  const JoinUsing = astNode('JoinUsing', All(/^USING/i, List(Column)));
  const Join = astNode('Join', All(JoinType, Table, Optional(Any(JoinOn, JoinUsing))));
  const From = astNode('From', All(/^FROM/i, FromList, Star(Join)));

  /**
   * Where
   * ----------------------------------------------------------------------------------------
   */
  const Where = WhereRule(Expression);

  /**
   * Group By
   * ----------------------------------------------------------------------------------------
   */
  const GroupBy = astNode('GroupBy', All(/^GROUP BY/i, OptionalBrackets(List(Column))));

  /**
   * Having
   * ----------------------------------------------------------------------------------------
   */
  const Having = astNode('Having', All(/^HAVING/i, Expression));

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
  const CombinationType = astUpperLeaf('CombinationType', /^(UNION|INTERSECT|EXCEPT)/i);
  const Combination = astNode('Combination', All(CombinationType, /^SELECT/i, ...SelectParts));

  /**
   * Order
   * ----------------------------------------------------------------------------------------
   */
  const OrderBy = OrderRule(Expression);

  /**
   * Limit
   * ----------------------------------------------------------------------------------------
   */
  const LimitAll = astEmptyLeaf('LimitAll', /^ALL/i);
  const Limit = astNode('Limit', All(/^LIMIT/i, Any(Count, LimitAll)));
  const Offset = astNode('Offset', All(/^OFFSET/i, Count));

  return astNode(
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
const Columns = astNode('Columns', Brackets(List(IdentifierRestricted)));
const Default = astEmptyLeaf('Default', /^DEFAULT/i);

/**
 * Update
 * ----------------------------------------------------------------------------------------
 */

const SetItem = astNode('SetItem', All(Identifier, '=', Any(Default, Expression)));
const Values = astNode('Values', Brackets(List(Any(Default, Expression))));
const SetList = astNode('SetList', List(SetItem));
const SetMap = astNode('SetMap', All(Columns, '=', Any(All(Optional(/^ROW/i), Values), Brackets(Select))));
const Set = astNode('Set', All(/^SET/i, Any(SetList, SetMap)));

const UpdateFrom = astNode('UpdateFrom', All(/^FROM/i, List(FromList)));
const ReturningListItem = astNode('ReturningListItem', Any(StarIdentifier, All(Any(Expression), Optional(As))));
const Returning = astNode('Returning', All(/^RETURNING/i, List(ReturningListItem)));
const Update = astNode(
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
const Using = astNode('Using', All(/^USING/i, List(FromList)));
const Delete = astNode(
  'Delete',
  All(/^DELETE FROM/i, Table, Optional(Using), Optional(Where), Optional(Returning), Optional(';')),
);

/**
 * Insert
 * ----------------------------------------------------------------------------------------
 */
const Collate = astLeaf('Collate', All(/^COLLATE/i, QuotedNameRule));
const ConflictTarget = astNode(
  'ConflictTarget',
  All(Brackets(List(All(Column, Optional(Brackets(Expression)), Optional(Collate)))), Optional(Where)),
);
const ConflictConstraint = astLeaf('ConflictConstraint', All(/^ON CONSTRAINT/i, Identifier));

const DoNothing = astEmptyLeaf('DoNothing', /^DO NOTHING/i);
const DoUpdate = astNode('DoUpdate', All(/^DO UPDATE/i, Set, Optional(Where)));
const Conflict = astNode(
  'Conflict',
  All(
    /^ON CONFLICT/i,
    Any(Any(DoNothing, DoUpdate), All(Any(ConflictTarget, ConflictConstraint), Any(DoNothing, DoUpdate))),
  ),
);

const ValuesList = astNode('ValuesList', All(/^VALUES/i, Any(List(Values), Parameter)));
const Insert = astNode(
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
const CTE = astNode('CTE', All(Identifier, /^AS/, Brackets(Query)));
const With = astNode('With', All(/^WITH/i, List(CTE), Query));

/**
 * Transaction
 * ----------------------------------------------------------------------------------------
 */

const Begin = astEmptyLeaf('Begin', All(/^BEGIN/i, Optional(';')));
const Savepoint = astNode('Savepoint', All(/^SAVEPOINT/i, Identifier, Optional(';')));
const Commit = astEmptyLeaf('Commit', All(/^COMMIT/i, Optional(';')));
const Rollback = astNode('Rollback', All(/^ROLLBACK/i, Optional(All(/^TO/i, Identifier)), Optional(';')));

// Ignore line comments and all whitespace
const IgnoreComments = (node: FunctionRule) => Ignore(/^\s+|^--[^\r\n]*\n/, node);

export const Grammar = IgnoreComments(Any(With, Select, Update, Delete, Insert, Begin, Savepoint, Commit, Rollback));
