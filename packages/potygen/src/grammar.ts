import {
  All,
  Any,
  IfNot,
  Ignore,
  LeftBinaryOperator,
  Node,
  Optional,
  Parser,
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
  Node(rule, (values, $, $next) => ({ tag, values, start: $.pos, end: $next.pos - 1 }));

/**
 * A helper function that creates a {@link LeafTag}.
 */
const astLeaf = <T extends Tag.LeafTag | Tag.CommentTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value, start: $.pos, end: $next.pos - 1 }));

/**
 * A helper function that creates a {@link EmptyLeafTag}.
 */
const astEmptyLeaf = <T extends Tag.EmptyLeafTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, (_, $, $next) => ({ tag, start: $.pos, end: $next.pos - 1 }));

/**
 * A helper function that creates a {@link LeafTag} and transforms the value to uppercase.
 * Used for various SQL releated tasks that are all uppercased like "DEFAULT", "LEFT JOIN" etc.
 */
const astUpperLeaf = <T extends Tag.LeafTag>(tag: T['tag'], rule: Rule) =>
  Node(rule, ([value], $, $next) => ({ tag, value: value.toUpperCase(), start: $.pos, end: $next.pos - 1 }));

/**
 * A helper function that creates a {@link NodeTag}
 * If we match any of the additional cases, return the additional node, with the first node as the first of its children.
 * This allows us to efficiently cover cases like this, as "expression" would be parsed only once
 *
 * ```
 * expression
 * expression = other thing
 * ...
 * ```
 */
const astNodeOrSwitch = (rule: Rule, cases: Array<Rule>) =>
  Node(All(rule, Optional(Any(...cases))), (values, $, $next) =>
    values.length === 1
      ? values[0]
      : { ...values[1], values: [values[0], ...values[1].values], start: $.pos, end: $next.pos - 1 },
  );

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
const IdentifierRule = /^([A-Z_][A-Z0-9_]*)/i;
const QuotedIdentifierRule = /^"((?:""|[^"])*)"/;

const RestrictedReservedKeywords =
  /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|ABORT|ABSOLUTE|ACCESS|ACTION|ADD|ADMIN|AFTER|AGGREGATE|ALSO|ALTER|ASSERTION|ASSIGNMENT|AT|BACKWARD|BEFORE|BEGIN|BY|CACHE|CALLED|CASCADE|CHAIN|CHARACTERISTICS|CHECKPOINT|CLASS|CLOSE|CLUSTER|COMMENT|COMMIT|COMMITTED|CONNECTION|CONSTRAINTS|CONVERSION|COPY|CREATEDB|CREATEROLE|CREATEUSER|CSV|CURSOR|CYCLE|DATABASE|DAY|DEALLOCATE|DECLARE|DEFAULTS|DEFERRED|DEFINER|DELETE|DELIMITER|DELIMITERS|DISABLE|DOMAIN|DOUBLE|DROP|EACH|ENABLE|ENCODING|ENCRYPTED|ESCAPE|EXCLUDING|EXCLUSIVE|EXECUTE|EXPLAIN|EXTERNAL|FETCH|FIRST|FORCE|FORWARD|FUNCTION|GLOBAL|GRANTED|HANDLER|HEADER|HOLD|HOUR|IMMEDIATE|IMMUTABLE|IMPLICIT|INCLUDING|INCREMENT|INDEX|INHERIT|INHERITS|INPUT|INSENSITIVE|INSERT|INSTEAD|INVOKER|ISOLATION|KEY|LANCOMPILER|LANGUAGE|LARGE|LAST|LEVEL|LISTEN|LOAD|LOCAL|LOCATION|LOCK|LOGIN|MATCH|MAXVALUE|MINUTE|MINVALUE|MODE|MONTH|MOVE|NAMES|NEXT|NO|NOCREATEDB|NOCREATEROLE|NOCREATEUSER|NOINHERIT|NOLOGIN|NOSUPERUSER|NOTHING|NOTIFY|NOWAIT|OBJECT|OF|OIDS|OPERATOR|OPTION|OWNER|PARTIAL|PASSWORD|PREPARE|PREPARED|PRESERVE|PRIOR|PRIVILEGES|PROCEDURAL|PROCEDURE|QUOTE|READ|RECHECK|REINDEX|RELATIVE|RELEASE|RENAME|REPEATABLE|REPLACE|RESET|RESTART|RESTRICT|RETURNS|REVOKE|ROLE|ROLLBACK|ROWS|RULE|SAVEPOINT|SCHEMA|SCROLL|SECOND|SECURITY|SEQUENCE|SERIALIZABLE|SESSION|SET|SHARE|SHOW|SIMPLE|STABLE|START|STATEMENT|STATISTICS|STDIN|STDOUT|STORAGE|STRICT|SUPERUSER|SYSID|SYSTEM|TABLESPACE|TEMP|TEMPLATE|TEMPORARY|TOAST|TRANSACTION|TRIGGER|TRUNCATE|TRUSTED|TYPE|UNCOMMITTED|UNENCRYPTED|UNKNOWN|UNLISTEN|UNTIL|UPDATE|VACUUM|VALID|VALIDATOR|VALUES|VARYING|VIEW|VOLATILE|WITH|WITHOUT|WORK|WRITE|YEAR|ZONE|CROSS|OUTER|RIGHT|LEFT|FULL|JOIN|INNER|RETURNING)$/i;
const ReservedKeywords =
  /^(?:ALL|ANALYSE|ANALYZE|AND|ANY|ARRAY|AS|ASC|ASYMMETRIC|BOTH|CASE|CAST|CHECK|COLLATE|COLUMN|CONSTRAINT|CREATE|CURRENT_DATE|CURRENT_ROLE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|DO|ELSE|END|EXCEPT|FALSE|FOR|FOREIGN|FROM|GRANT|GROUP|HAVING|IN|INITIALLY|INTERSECT|INTO|LEADING|LIMIT|LOCALTIME|LOCALTIMESTAMP|NEW|NOT|NULL|OFF|OFFSET|OLD|ON|ONLY|OR|ORDER|PLACING|PRIMARY|REFERENCES|SELECT|SESSION_USER|SOME|SYMMETRIC|TABLE|THEN|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|WHEN|WHERE|DER|RETURNING)$/i;

const QuotedIdentifier = astLeaf<Tag.QuotedIdentifierTag>(Tag.SqlName.QuotedIdentifier, QuotedIdentifierRule);
const UnquotedIdentifierRestricted = astLeaf<Tag.UnquotedIdentifierTag>(
  Tag.SqlName.UnquotedIdentifier,
  IfNot(ReservedKeywords, IdentifierRule),
);
const QuotedIdentifierLessRestricted = astLeaf<Tag.UnquotedIdentifierTag>(
  Tag.SqlName.UnquotedIdentifier,
  IfNot(RestrictedReservedKeywords, IdentifierRule),
);
const UnquotedIdentifier = astLeaf<Tag.UnquotedIdentifierTag>(Tag.SqlName.UnquotedIdentifier, IdentifierRule);

/**
 * An identifier, but only allows specific names
 */
const SpecificIdentifier = (rule: RegExp) => astLeaf<Tag.UnquotedIdentifierTag>(Tag.SqlName.UnquotedIdentifier, rule);

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

const ColumnFullyQualified = astNode<Tag.ColumnTag>(
  Tag.SqlName.Column,
  All(Identifier, '.', Identifier, '.', IdentifierRestricted),
);
const ColumnQualified = astNode<Tag.ColumnTag>(
  Tag.SqlName.Column,
  All(IdentifierRestricted, '.', IdentifierRestricted),
);
const ColumnUnqualified = astNode<Tag.ColumnTag>(Tag.SqlName.Column, IdentifierRestricted);

/**
 * Columns with qualifiers
 */
const Column = Any(ColumnFullyQualified, ColumnQualified, ColumnUnqualified);

/**
 * Parameteer
 */
const Parameter = Node<Tag.ParameterTag>(
  All(/^(\$\$|\$|\:)/, IdentifierRule, Optional(Any(/^(\!)/, Brackets(List(UnquotedIdentifier))))),
  ([type, value, ...rest], $, $next) => ({
    tag: Tag.SqlName.Parameter,
    value,
    type: type === '$$' ? 'spread' : 'single',
    required: rest.includes('!'),
    pick: rest.filter((item) => item !== '!'),
    start: $.pos,
    end: $next.pos - 1,
  }),
);

/**
 * AS Clause
 */
const As = astNode<Tag.AsTag>(Tag.SqlName.As, Any(All(/^AS/i, Identifier), IdentifierLessRestricted));

/**
 * Constant
 */
const Null = astEmptyLeaf<Tag.NullTag>(Tag.SqlName.Null, /^NULL/i);
const IntegerRule = /^([0-9]+)/;
const NumberRule = Any(
  IntegerRule,
  /^([0-9]+(\.[0-9]+)?(e([+-]?[0-9]+))?)/,
  /^(([0-9]+)?\.[0-9]+(e([+-]?[0-9]+)?))/,
  /^([0-9]+e([+-]?[0-9]+))'/,
);
const StringRule = /^'((?:''|[^'])*)'/;
const String = astLeaf<Tag.StringTag>(Tag.SqlName.String, /^'((?:''|[^'])*)'/);
const EscapeString = astLeaf<Tag.EscapeStringTag>(Tag.SqlName.EscapeString, All(/^E/i, StringRule));
const HexademicalString = astLeaf<Tag.HexademicalStringTag>(Tag.SqlName.HexademicalString, All(/^X/i, StringRule));
const BitString = astLeaf<Tag.BitStringTag>(Tag.SqlName.BitString, All(/^B/i, StringRule));
const DollarQuatedString = astLeaf<Tag.DollarQuotedStringTag>(Tag.SqlName.DollarQuotedString, /^\$\$((?:\$\$|.)*)\$\$/);
const CustomDollarQuatedString = Node<Tag.CustomQuotedStringTag>(
  /^\$(?<delimiter>[A-Z_][A-Z0-9_]*)\$((?:\$\$|.)*)\$\k<delimiter>\$/i,
  ([delimiter, value], $, $next) => ({
    tag: Tag.SqlName.CustomQuotedString,
    value,
    delimiter,
    start: $.pos,
    end: $next.pos - 1,
  }),
);
const Integer = astLeaf<Tag.IntegerTag>(Tag.SqlName.Integer, IntegerRule);
const Number = astLeaf<Tag.NumberTag>(Tag.SqlName.Number, NumberRule);
const Boolean = astUpperLeaf<Tag.BooleanTag>(Tag.SqlName.Boolean, /^(TRUE|FALSE)/i);

const AllTypesRule =
  /^(xml|xid|void|varchar|varbit|uuid|unknown|txid_snapshot|tsvector|tstzrange|tsrange|tsm_handler|trigger|tinterval|timetz|timestamptz|timestamp without time zone|timestamp with time zone|timestamp|time without time zone|time with time zone|time|tid|text|smgr|smallserial|smallint|serial|reltime|regtype|regrole|regprocedure|regproc|regoperator|regoper|regnamespace|regdictionary|regconfig|regclass|refcursor|record|real|query|polygon|point|pg_lsn|pg_ddl_command|path|opaque|oid|numeric|name|mrange|money|macaddr8|macaddr|lseg|line|language_handler|jsonb|json|interval|internal|integer|int8range|int8|int4range|int4|int2vector|int2|int|inet|index_am_handler|float8|float4|fdw_handler|event_trigger|double precision|daterange|date|cstring|circle|cidr|cid|character varying|character|char|bytea|bpchar|box|boolean|bool|bit varying|bit|bigserial|bigint|aclitem|abstime)/i;

const ConstantType = astUpperLeaf<Tag.ConstantTypeTag>(Tag.SqlName.ConstantType, AllTypesRule);

const TypedConstant = astNode<Tag.TypedConstantTag>(
  Tag.SqlName.TypedConstant,
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
  astNode<Tag.QualifiedIdentifierTag>(Tag.SqlName.QualifiedIdentifier, Any(SpecificIdentifier(rule), QuotedIdentifier));

const TypeQualifiedIdentifier = (rule: RegExp) => {
  const IdentifierNode = Any(SpecificIdentifier(rule), QuotedIdentifier);
  return astNode<Tag.QualifiedIdentifierTag>(
    Tag.SqlName.QualifiedIdentifier,
    Any(All(SpecificIdentifier(IdentifierRule), '.', IdentifierNode), IdentifierNode),
  );
};

const Type = astNode<Tag.TypeTag>(
  Tag.SqlName.Type,
  Any(
    All(TypeIdentifier(DoubleParamTypeRule), Brackets(Any(All(Integer, ',', Integer), Integer))),
    All(TypeIdentifier(SingleParamTypeRule), Brackets(Integer)),
    TypeIdentifier(AllTypesRule),
    TypeQualifiedIdentifier(IdentifierRule),
  ),
);
const Dimension = astEmptyLeaf<Tag.DimensionTag>(Tag.SqlName.Dimension, SquareBrackets());
const TypeArray = astNode<Tag.ArrayTypeTag>(Tag.SqlName.ArrayType, All(Type, Plus(Dimension)));
const AnyType = Any(TypeArray, Type);

/**
 * Count
 */
const CastableRule = (DataType: Rule) =>
  Node<Tag.CastableDataTypeTag>(All(DataType, Optional(All('::', AnyType))), ([value, type], $, $next) => {
    return type ? { tag: Tag.SqlName.PgCast, values: [value, type], start: $.pos, end: $next.pos } : value;
  });

const Count = astNode<Tag.CountTag>(Tag.SqlName.Count, CastableRule(Any(Integer, Parameter)));

/**
 * Table
 */
const QualifiedIdentifier = astNode<Tag.QualifiedIdentifierTag>(
  Tag.SqlName.QualifiedIdentifier,
  Any(All(Identifier, '.', Identifier), IdentifierRestricted),
);
const Table = astNode<Tag.TableTag>(Tag.SqlName.Table, All(QualifiedIdentifier, Optional(As)));

/**
 * SELECT
 * ========================================================================================================================
 */

const DistinctOnList = All(/^ON/i, Brackets(List(Column)));
const Distinct = astNode<Tag.DistinctTag>(Tag.SqlName.Distinct, All(/^DISTINCT/i, Optional(DistinctOnList)));

const StarSql = astEmptyLeaf<Tag.StarTag>(Tag.SqlName.Star, '*');
const StarIdentifier = Any(
  astNode<Tag.StarIdentifierTag>(Tag.SqlName.StarIdentifier, All(Identifier, '.', Identifier, '.', StarSql)),
  astNode<Tag.StarIdentifierTag>(Tag.SqlName.StarIdentifier, All(Identifier, '.', StarSql)),
  astNode<Tag.StarIdentifierTag>(Tag.SqlName.StarIdentifier, StarSql),
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
  /^(NOT LIKE|NOT ILIKE|LIKE|ILIKE)/i,
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
  const OrderDirection = astLeaf<Tag.OrderDirectionTag>(Tag.SqlName.OrderDirection, /^(ASC|DESC|USNIG >|USING <)/i);
  const OrderByItem = astNode<Tag.OrderByItemTag>(Tag.SqlName.OrderByItem, All(Expression, Optional(OrderDirection)));
  return astNode<Tag.OrderByTag>(Tag.SqlName.OrderBy, All(/^ORDER BY/i, List(OrderByItem)));
};

const Function = (ChildExpression: Rule): Rule => {
  /**
   * Function
   * ----------------------------------------------------------------------------------------
   */
  const FunctionDistinct = astNode<Tag.DistinctTag>(Tag.SqlName.Distinct, /^DISTINCT/i);
  const FunctionFilter = astNode<Tag.FilterTag>(
    Tag.SqlName.Filter,
    All(/^FILTER/i, Brackets(WhereRule(ChildExpression))),
  );
  const FunctionIdentifier = astNode<Tag.QualifiedIdentifierTag>(
    Tag.SqlName.QualifiedIdentifier,
    Any(All(Identifier, '.', Identifier), IdentifierRestricted),
  );
  return astNode<Tag.FunctionTag>(
    Tag.SqlName.Function,
    Any(
      astNode<Tag.QualifiedIdentifierTag>(
        Tag.SqlName.QualifiedIdentifier,
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
};

const ExpressionRule = (SelectExpression: Rule): Rule =>
  Y((ChildExpression) => {
    const ArrayConstructor = astNode<Tag.ArrayConstructorTag>(
      Tag.SqlName.ArrayConstructor,
      All(/^ARRAY/i, SquareBrackets(List(ChildExpression))),
    );

    const ArrayIndexRange = astNode<Tag.ArrayIndexRangeTag>(
      Tag.SqlName.ArrayIndexRange,
      All(ChildExpression, ':', ChildExpression),
    );
    const ArrayColumnIndex = astNode<Tag.ArrayColumnIndexTag>(
      Tag.SqlName.ArrayColumnIndex,
      All(Column, SquareBrackets(Any(ArrayIndexRange, ChildExpression))),
    );
    const ArrayIndex = astNode<Tag.ArrayIndexTag>(
      Tag.SqlName.ArrayIndex,
      SquareBrackets(Any(ArrayIndexRange, ChildExpression)),
    );
    const CompositeAccess = astNode<Tag.CompositeAccessTag>(Tag.SqlName.CompositeAccess, All('.', Identifier));

    const RowKeyward = astNode<Tag.RowKeywardTag>(
      Tag.SqlName.RowKeyward,
      All(/^ROW/i, Brackets(List(ChildExpression))),
    );
    const Row = astNode<Tag.RowTag>(Tag.SqlName.Row, Brackets(MultiList(ChildExpression)));

    const ExtractField = astLeaf<Tag.ExtractFieldTag>(
      Tag.SqlName.ExtractField,
      /^(century|day|decade|dow|doy|epoch|hour|isodow|isoyear|julian|microseconds|millennium|milliseconds|minute|month|quarter|second|timezone|timezone_hour|timezone_minute|week|year)/i,
    );
    const Extract = astNode<Tag.ExtractTag>(
      Tag.SqlName.Extract,
      All(/^EXTRACT/i, Brackets(All(ExtractField, /^FROM/i, ChildExpression))),
    );

    const WrappedExpression = astNode<Tag.WrappedExpressionTag>(
      Tag.SqlName.WrappedExpression,
      All(Brackets(ChildExpression), Optional(Any(ArrayIndex, CompositeAccess))),
    );

    const Exists = astNode<Tag.ExistsTag>(Tag.SqlName.Exists, All(/^EXISTS/i, Brackets(SelectExpression)));

    /**
     * PgCast
     * ----------------------------------------------------------------------------------------
     */
    const DataType = Any(
      ArrayColumnIndex,
      WrappedExpression,
      ColumnFullyQualified,
      Constant,
      Parameter,
      ArrayConstructor,
      Row,
      RowKeyward,
      Exists,
      Extract,
      Function(ChildExpression),
      ColumnQualified,
      Null,
      ColumnUnqualified,
      Brackets(SelectExpression),
    );
    /**
     * Cast
     * ----------------------------------------------------------------------------------------
     */
    const Cast = astNode<Tag.CastTag>(Tag.SqlName.Cast, All(/^CAST/i, Brackets(All(DataType, /^AS/i, AnyType))));
    const CastableDataType = CastableRule(DataType);

    /**
     * Case
     * ----------------------------------------------------------------------------------------
     */
    const When = astNode<Tag.WhenTag>(Tag.SqlName.When, All(/^WHEN/i, ChildExpression, /^THEN/i, ChildExpression));
    const Else = astNode<Tag.ElseTag>(Tag.SqlName.Else, All(/^ELSE/i, ChildExpression));
    const CaseSimple = astNode<Tag.CaseSimpleTag>(
      Tag.SqlName.CaseSimple,
      All(/^CASE/i, CastableDataType, Plus(When), Optional(Else), /^END/i),
    );
    const CaseNormal = astNode<Tag.CaseTag>(Tag.SqlName.Case, All(/^CASE/i, Plus(When), Optional(Else), /^END/i));

    const DataExpression = CastableRule(Any(CaseNormal, CaseSimple, CastableDataType));

    /**
     * Comparation Expression
     * ----------------------------------------------------------------------------------------
     */
    const ComparationArrayInclusionType = astUpperLeaf<Tag.ComparationArrayInclusionTypeTag>(
      Tag.SqlName.ComparationArrayInclusionType,
      /^(IN|NOT IN)/i,
    );
    const ComparationArrayType = astUpperLeaf<Tag.ComparationArrayTypeTag>(
      Tag.SqlName.ComparationArrayType,
      /^(ANY|SOME|ALL)/i,
    );
    const ComparationArrayOperator = astUpperLeaf<Tag.ComparationArrayOperatorTag>(
      Tag.SqlName.ComparationArrayOperator,
      /^(<=|>=|<|>|<>|!=|=|AND|OR)/i,
    );
    const ComparationArraySubject = Brackets(Any(DataExpression, SelectExpression));
    const ExpressionList = astNode<Tag.ExpressionListTag>(Tag.SqlName.ExpressionList, List(ChildExpression));
    const ComparationArrayInclusion = astNode<Tag.ComparationArrayInclusionTag>(
      Tag.SqlName.ComparationArrayInclusion,
      All(ComparationArrayInclusionType, Any(Brackets(ExpressionList), Parameter)),
    );
    const ComparationArray = astNode<Tag.ComparationArrayTag>(
      Tag.SqlName.ComparationArray,
      All(ComparationArrayOperator, ComparationArrayType, ComparationArraySubject),
    );

    const CombinedExpession = astNodeOrSwitch(DataExpression, [ComparationArrayInclusion, ComparationArray]);

    /**
     * Ternary Operator
     * ----------------------------------------------------------------------------------------
     */
    const TernaryExpression = TernaryOperator.reduce((Current, [Operator, Separator]) => {
      const OperatorNode = astUpperLeaf<Tag.TernaryOperatorTag>(Tag.SqlName.TernaryOperator, Operator);
      const SeparatorNode = astUpperLeaf<Tag.TernarySeparatorTag>(Tag.SqlName.TernarySeparator, Separator);
      return astNode<Tag.TernaryExpressionTag>(
        Tag.SqlName.TernaryExpression,
        All(Current, OperatorNode, Current, SeparatorNode, Current),
      );
    }, CombinedExpession);

    const DataOrTernaryExpression = Any(TernaryExpression, CombinedExpession);

    /**
     * Unary Operator
     * ----------------------------------------------------------------------------------------
     */
    const UnaryOperatorNode = astUpperLeaf<Tag.UnaryOperatorTag>(Tag.SqlName.UnaryOperator, UnaryOperator);
    const UnaryExpression = Node<Tag.UnaryExpressionTag>(
      All(Star(UnaryOperatorNode), DataOrTernaryExpression),
      (parts, $, $next) =>
        parts.reduceRight((value, operator) => {
          return { tag: Tag.SqlName.UnaryExpression, values: [operator, value], start: $.pos, end: $next.pos };
        }),
    );

    /**
     * Binary Operator
     * ----------------------------------------------------------------------------------------
     */
    const BinaryExpression = BinaryOperator.reduce((Current, Operator) => {
      const OperatorNode = astUpperLeaf<Tag.BinaryOperatorTag>(Tag.SqlName.BinaryOperator, Operator);
      return Node<Tag.BinaryExpressionTag, any>(
        All(Current, Star(All(OperatorNode, Current))),
        LeftBinaryOperator((values, $, $next) => ({
          tag: Tag.SqlName.BinaryExpression,
          values,
          start: $.pos,
          end: $next.pos - 1,
        })),
      );
    }, UnaryExpression);

    return Any(Cast, BinaryExpression);
  });

const FromListRule = (Select: Rule, ChildExpression: Rule): Rule => {
  const NamedSelect = astNode<Tag.NamedSelectTag>(Tag.SqlName.NamedSelect, All(Brackets(Select), As));

  const AsColumn = astNode<Tag.AsColumnTag>(Tag.SqlName.AsColumn, All(Identifier, Type));
  const AsColumnList = astNode<Tag.AsColumnListTag>(Tag.SqlName.AsColumnList, List(AsColumn));
  const AsRecordset = astNode<Tag.AsRecordsetTag>(
    Tag.SqlName.AsRecordset,
    All(/^AS/i, Identifier, Brackets(AsColumnList)),
  );
  const RecordsetFunction = astNode<Tag.RecordsetFunctionTag>(
    Tag.SqlName.RecordsetFunction,
    All(Function(ChildExpression), AsRecordset),
  );

  return astNode<Tag.FromListTag>(Tag.SqlName.FromList, List(Any(RecordsetFunction, Table, NamedSelect)));
};

const WhereRule = (Expression: Rule): Rule => astNode<Tag.WhereTag>(Tag.SqlName.Where, All(/^WHERE/i, Expression));

const Select = Y((SelectExpression) => {
  const Expression = ExpressionRule(SelectExpression);

  const SelectListItem = astNode<Tag.SelectListItemTag>(
    Tag.SqlName.SelectListItem,
    Any(StarIdentifier, All(Any(Expression), Optional(As))),
  );
  const SelectList = astNode<Tag.SelectListTag>(Tag.SqlName.SelectList, List(SelectListItem));

  /**
   * From
   * ----------------------------------------------------------------------------------------
   */
  const FromList = FromListRule(SelectExpression, Expression);

  const JoinType = astUpperLeaf(
    Tag.SqlName.JoinType,
    /^(JOIN|INNER JOIN|LEFT JOIN|LEFT OUTER JOIN|RIGHT JOIN|RIGHT OUTER JOIN|FULL JOIN|FULL OUTER JOIN|CROSS JOIN)/i,
  );
  const JoinOn = astNode<Tag.JoinOnTag>(Tag.SqlName.JoinOn, All(/^ON/i, Expression));
  const JoinUsing = astNode<Tag.JoinUsingTag>(Tag.SqlName.JoinUsing, All(/^USING/i, List(Column)));

  const Join = Y((ChildJoin) => {
    const InnerTableWithJoin = astNode<Tag.TableWithJoinTag>(
      Tag.SqlName.TableWithJoin,
      Brackets(All(Table, Star(ChildJoin))),
    );
    return astNode<Tag.JoinTag>(
      Tag.SqlName.Join,
      All(JoinType, Any(Table, InnerTableWithJoin), Optional(Any(JoinOn, JoinUsing))),
    );
  });
  const TableWithJoin = Y((Child) =>
    astNode<Tag.TableWithJoinTag>(Tag.SqlName.TableWithJoin, Brackets(All(Any(Table, Child), Star(Join)))),
  );

  const From = astNode<Tag.FromTag>(Tag.SqlName.From, All(/^FROM/i, Any(All(FromList, Star(Join)), TableWithJoin)));

  /**
   * Where
   * ----------------------------------------------------------------------------------------
   */
  const Where = WhereRule(Expression);

  /**
   * Group By
   * ----------------------------------------------------------------------------------------
   */
  const GroupBy = astNode<Tag.GroupByTag>(Tag.SqlName.GroupBy, All(/^GROUP BY/i, OptionalBrackets(List(Column))));

  /**
   * Having
   * ----------------------------------------------------------------------------------------
   */
  const Having = astNode<Tag.HavingTag>(Tag.SqlName.Having, All(/^HAVING/i, Expression));

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
    Tag.SqlName.CombinationType,
    /^(UNION ALL|INTERSECT ALL|EXCEPT ALL|UNION|INTERSECT|EXCEPT)/i,
  );
  const Combination = astNode<Tag.CombinationTag>(
    Tag.SqlName.Combination,
    All(CombinationType, /^SELECT/i, ...SelectParts),
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
  const LimitAll = astEmptyLeaf<Tag.LimitAllTag>(Tag.SqlName.LimitAll, /^ALL/i);
  const Limit = astNode<Tag.LimitTag>(Tag.SqlName.Limit, All(/^LIMIT/i, Any(Count, LimitAll)));
  const Offset = astNode<Tag.OffsetTag>(Tag.SqlName.Offset, All(/^OFFSET/i, Count));

  return astNode<Tag.SelectTag>(
    Tag.SqlName.Select,
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
const FromList = FromListRule(Select, Expression);
const Where = WhereRule(Expression);
const Columns = astNode<Tag.ColumnsTag>(Tag.SqlName.Columns, Brackets(List(IdentifierRestricted)));
const Default = astEmptyLeaf<Tag.DefaultTag>(Tag.SqlName.Default, /^DEFAULT/i);

/**
 * Update
 * ----------------------------------------------------------------------------------------
 */

const SetItem = astNode<Tag.SetItemTag>(Tag.SqlName.SetItem, All(Identifier, '=', Any(Default, Expression)));
const Values = astNode<Tag.ValuesTag>(Tag.SqlName.Values, Brackets(List(Any(Default, Expression))));
const SetList = astNode<Tag.SetListTag>(Tag.SqlName.SetList, List(SetItem));
const SetMap = astNode<Tag.SetMapTag>(
  Tag.SqlName.SetMap,
  All(Columns, '=', Any(All(Optional(/^ROW/i), Values), Brackets(Select))),
);
const Set = astNode<Tag.SetTag>(Tag.SqlName.Set, All(/^SET/i, Any(SetList, SetMap)));

const UpdateFrom = astNode<Tag.UpdateFromTag>(Tag.SqlName.UpdateFrom, All(/^FROM/i, List(FromList)));
const ReturningListItem = astNode<Tag.ReturningListItemTag>(
  Tag.SqlName.ReturningListItem,
  Any(StarIdentifier, All(Any(Expression), Optional(As))),
);
const Returning = astNode<Tag.ReturningTag>(Tag.SqlName.Returning, All(/^RETURNING/i, List(ReturningListItem)));
const Update = astNode<Tag.UpdateTag>(
  Tag.SqlName.Update,
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
const Using = astNode<Tag.UsingTag>(Tag.SqlName.Using, All(/^USING/i, List(FromList)));
const Delete = astNode<Tag.DeleteTag>(
  Tag.SqlName.Delete,
  All(/^DELETE FROM/i, Table, Optional(Using), Optional(Where), Optional(Returning), Optional(';')),
);

/**
 * Insert
 * ----------------------------------------------------------------------------------------
 */
const Collate = astLeaf<Tag.CollateTag>(Tag.SqlName.Collate, All(/^COLLATE/i, QuotedIdentifierRule));
const WrappedExpression = astNode<Tag.WrappedExpressionTag>(Tag.SqlName.WrappedExpression, Brackets(Expression));

const ConflictTargetIndex = astNode<Tag.ConflictTargetIndexTag>(
  Tag.SqlName.ConflictTargetIndex,
  All(Any(Column, WrappedExpression), Optional(Collate)),
);
const ConflictTarget = astNode<Tag.ConflictTargetTag>(
  Tag.SqlName.ConflictTarget,
  All(Brackets(List(ConflictTargetIndex)), Optional(Where)),
);
const ConflictConstraint = astLeaf<Tag.ConflictConstraintTag>(
  Tag.SqlName.ConflictConstraint,
  All(/^ON CONSTRAINT/i, Identifier),
);

const DoNothing = astEmptyLeaf<Tag.DoNothingTag>(Tag.SqlName.DoNothing, /^DO NOTHING/i);
const DoUpdate = astNode<Tag.DoUpdateTag>(Tag.SqlName.DoUpdate, All(/^DO UPDATE/i, Set, Optional(Where)));
const Conflict = astNode<Tag.ConflictTag>(
  Tag.SqlName.Conflict,
  All(
    /^ON CONFLICT/i,
    Any(Any(DoNothing, DoUpdate), All(Any(ConflictTarget, ConflictConstraint), Any(DoNothing, DoUpdate))),
  ),
);

const ValuesList = astNode<Tag.ValuesListTag>(Tag.SqlName.ValuesList, All(/^VALUES/i, Any(List(Values), Parameter)));
const Insert = astNode<Tag.InsertTag>(
  Tag.SqlName.Insert,
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
const CTEName = astNode<Tag.CTENameTag>(Tag.SqlName.CTEName, All(Identifier, Optional(Columns)));
const CTEValues = astNode<Tag.CTEValuesTag>(Tag.SqlName.CTEValues, Brackets(List(Expression)));
const CTEValuesList = astNode<Tag.CTEValuesListTag>(
  Tag.SqlName.CTEValuesList,
  All(/^VALUES/i, Any(List(CTEValues), Parameter)),
);
const CTE = astNode<Tag.CTETag>(Tag.SqlName.CTE, All(CTEName, /^AS/i, Brackets(Any(Query, CTEValuesList))));
const With = astNode<Tag.WithTag>(Tag.SqlName.With, All(/^WITH/i, List(CTE), Query));

/**
 * Transaction
 * ----------------------------------------------------------------------------------------
 */

const Begin = astEmptyLeaf<Tag.BeginTag>(Tag.SqlName.Begin, All(/^BEGIN/i, Optional(';')));
const Savepoint = astNode<Tag.SavepointTag>(Tag.SqlName.Savepoint, All(/^SAVEPOINT/i, Identifier, Optional(';')));
const Commit = astEmptyLeaf<Tag.CommitTag>(Tag.SqlName.Commit, All(/^COMMIT/i, Optional(';')));
const Rollback = astNode<Tag.RollbackTag>(
  Tag.SqlName.Rollback,
  All(/^ROLLBACK/i, Optional(All(/^TO/i, Identifier)), Optional(';')),
);

const Comment = astLeaf<Tag.CommentTag>(Tag.SqlName.Comment, /^--([^\r\n]*)\n/);

const Grammar = Ignore(
  // Ignore line comments and all whitespace
  Any(/^\s+/, Comment),
  Any(With, Select, Update, Delete, Insert, Begin, Savepoint, Commit, Rollback),
);

export const parser = Parser<Tag.AstTag, Tag.CommentTag>(Grammar);
export const partialParser = Parser<Tag.AstTag, Tag.CommentTag>(Grammar, undefined, true);
