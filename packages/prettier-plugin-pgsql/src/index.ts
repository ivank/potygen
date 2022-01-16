import { doc, Doc, Plugin, AstPath, Printer, Parser } from 'prettier';
import {
  parser,
  AstTag,
  CommentTag,
  SqlTag,
  Tag,
  isDistinct,
  range,
  isFunctionArg,
  isOrderBy,
  isFilter,
  isWhere,
  isWith,
  isInsert,
  chunk,
  isConflictTargetIndex,
} from '@potygen/potygen';

const { line, softline, indent, join, group, hardline } = doc.builders;

interface RootAstTag extends SqlTag {
  tag: 'Ast';
  value: AstTag;
  comments: CommentTag[];
}

type Node = RootAstTag | Tag | CommentTag;

const isRootAstTag = (value: SqlTag): value is RootAstTag => value.tag === 'Ast';

const wrapSubquery = (path: AstPath<any>, content: Doc): Doc => {
  const parent = path.getParentNode();
  return parent && (isRootAstTag(parent) || isWith(parent) || isInsert(parent))
    ? content
    : group(['(', indent([softline, content]), softline, ')']);
};

const vals = (path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] => path.map(print, 'values');

const nthVal = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc =>
  path.call(print, 'values', num < 0 ? path.getValue().values.length + num : num);

const initialVals = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] =>
  range(0, path.getValue().values.length - num).map((index) => path.call(print, 'values', index));

const tailVals = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] =>
  range(num, path.getValue().values.length).map((index) => path.call(print, 'values', index));

const filterIndexes = <T>(items: T[], predicate: (item: T) => boolean): number[] =>
  items.reduce<number[]>((acc, item, index) => (predicate(item) ? [...acc, index] : acc), []);

const pgsqlAst: Printer<Node> = {
  print: (path, options, recur) => {
    const node = path.getValue();

    switch (node.tag) {
      case 'Ast':
        return [path.call(recur, 'value'), softline];
      case 'Comment':
        return `-- ${node.value}`;
      case 'CTEName':
        return group(join(line, vals(path, recur)));
      case 'CTEValuesList':
        return group([
          '(',
          indent([softline, 'VALUES', group(indent([line, join([',', line], vals(path, recur))]))]),
          softline,
          ')',
        ]);
      case 'CTEValues':
        return group(['(', indent([softline, join([',', line], vals(path, recur))]), ')']);
      case 'CTE':
        return group([group([nthVal(0, path, recur), line, 'AS']), line, nthVal(1, path, recur)]);
      case 'With':
        return group([
          'WITH',
          indent([line, join([',', line], initialVals(1, path, recur))]),
          line,
          nthVal(-1, path, recur),
        ]);
      case 'Null':
        return 'NULL';
      case 'UnquotedIdentifier':
        return node.value;
      case 'QuotedIdentifier':
        return `"${node.value}"`;
      case 'Parameter':
        return [
          node.type === 'spread' ? '$$' : '$',
          node.value,
          node.pick.length
            ? group(['(', indent([softline, join([',', hardline], path.map(recur, 'pick'))]), softline, ')'])
            : '',
          node.required ? '!' : '',
        ];
      case 'Column':
        return group(join('.', vals(path, recur)));
      case 'As':
        return group(['AS', line, join(line, vals(path, recur))]);
      case 'String':
        return `'${node.value}'`;
      case 'DollarQuotedString':
        return `\$\$${node.value}\$\$`;
      case 'CustomQuotedString':
        return `\$${node.delimiter}\$${node.value}\$${node.delimiter}\$`;
      case 'BitString':
        return `B'${node.value}'`;
      case 'HexademicalString':
        return `X'${node.value}'`;
      case 'EscapeString':
        return `E'${node.value}'`;
      case 'Number':
        return node.value;
      case 'Integer':
        return node.value;
      case 'Boolean':
        return node.value;
      case 'ConstantType':
        return node.value;
      case 'TypedConstant':
        return join(' ', vals(path, recur));
      case 'ExtractField':
        return node.value;
      case 'Extract':
        return group([
          'EXTRACT',
          indent([line, '(', group([nthVal(0, path, recur), line, 'FROM']), line, nthVal(1, path, recur)]),
          ')',
        ]);
      case 'ArrayIndexRange':
        return group(join(':', vals(path, recur)));
      case 'ArrayColumnIndex':
        return group([group([nthVal(0, path, recur), softline]), '[', indent([softline, nthVal(1, path, recur)]), ']']);
      case 'ArrayIndex':
        return group(['[', indent([softline, vals(path, recur)]), ']']);
      case 'CompositeAccess':
        return group(['.', vals(path, recur)]);
      case 'Count':
        return vals(path, recur);
      case 'Dimension':
        return '[]';
      case 'Type':
        return node.values.length === 1
          ? nthVal(0, path, recur)
          : node.values.length === 2
          ? [nthVal(0, path, recur), '(', nthVal(1, path, recur), ')']
          : [nthVal(0, path, recur), '(', nthVal(1, path, recur), ',', nthVal(2, path, recur), ')'];
      case 'ArrayType':
        return vals(path, recur);
      case 'Distinct':
        return node.values.length
          ? ['DISTINCT ON (', group([indent([softline, join([',', line], vals(path, recur))]), softline]), ')']
          : ['DISTINCT'];
      case 'Filter':
        return [group(['FILTER', line]), group(['(', indent([softline, nthVal(0, path, recur)]), ')'])];
      case 'Star':
        return '*';
      case 'StarIdentifier':
        return group(join('.', vals(path, recur)));
      case 'Row':
        return [
          group(['ROW', line]),
          group(['(', indent([softline, join([',', line], vals(path, recur))]), softline, ')']),
        ];
      case 'When':
        return [
          group([
            group(['WHEN', indent([line, nthVal(0, path, recur)])]),
            indent([line, group(['THEN', line, nthVal(1, path, recur)])]),
          ]),
        ];
      case 'Else':
        return group(['ELSE', line, nthVal(0, path, recur)]);
      case 'CaseSimple':
        return group([
          group(['CASE', line, nthVal(0, path, recur)]),
          indent([line, join(line, tailVals(1, path, recur))]),
          line,
          'END',
        ]);
      case 'Case':
        return group(['CASE', indent([line, join(line, vals(path, recur))]), line, 'END']);
      case 'BinaryOperator':
        return node.value;
      case 'UnaryOperator':
        return node.value;
      case 'ComparationOperator':
        return node.value;
      case 'ComparationType':
        return node.value;
      case 'UnaryExpression':
        return join(['+', '-'].includes(node.values[0].value) ? '' : ' ', vals(path, recur));
      case 'BinaryExpression':
        return group([
          nthVal(0, path, recur),
          line,
          group([nthVal(1, path, recur), indent([line, nthVal(2, path, recur)])]),
        ]);
      case 'TernaryOperator':
        return node.value;
      case 'TernarySeparator':
        return node.value;
      case 'TernaryExpression':
        return group([
          nthVal(0, path, recur),
          indent([
            line,
            group([nthVal(1, path, recur), line, nthVal(2, path, recur)]),
            line,
            group([nthVal(3, path, recur), line, nthVal(4, path, recur)]),
          ]),
        ]);
      case 'Cast':
        return group([
          group(['CAST', line]),
          '(',
          indent([line, nthVal(0, path, recur), line, group(['AS', line, nthVal(1, path, recur)])]),
          line,
          ')',
        ]);
      case 'PgCast':
        return group(join('::', vals(path, recur)));
      case 'ArrayConstructor':
        return group([
          group(['ARRAY', softline, '[']),
          indent([softline, join([',', line], vals(path, recur))]),
          softline,
          ']',
        ]);
      case 'Function':
        const args = filterIndexes(node.values, isFunctionArg);
        const distinct = node.values.findIndex(isDistinct);
        const order = node.values.findIndex(isOrderBy);
        const filter = node.values.findIndex(isFilter);
        const name = node.values[0].values[0].value.toUpperCase();
        const isNoBrackets = ['CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP'].includes(name);
        const groupArgsByTwo = ['JSON_BUILD_OBJECT', 'JSONB_BUILD_OBJECT'].includes(name);

        return group([
          group([nthVal(0, path, recur), softline, isNoBrackets ? '' : '(']),
          indent([
            softline,
            distinct !== -1 ? [nthVal(distinct, path, recur), line] : [],
            join(
              [',', line],
              groupArgsByTwo
                ? chunk(2, args).map((chunk) =>
                    group(
                      join(
                        [',', line],
                        chunk.map((index) => nthVal(index, path, recur)),
                      ),
                    ),
                  )
                : args.map((index) => nthVal(index, path, recur)),
            ),
            order !== -1 ? [line, nthVal(order, path, recur)] : [],
          ]),
          softline,
          isNoBrackets ? '' : ')',
          filter !== -1 ? [line, nthVal(filter, path, recur)] : [],
        ]);
      case 'ComparationExpression':
        return node.values.length === 4
          ? [
              nthVal(0, path, recur),
              ' ',
              nthVal(1, path, recur),
              ' ',
              nthVal(2, path, recur),
              ' ',
              '(',
              nthVal(3, path, recur),
              ')',
            ]
          : join(' ', vals(path, recur));
      case 'SelectListItem':
        return group(join(' ', vals(path, recur)));
      case 'SelectList':
        return group(indent([line, join([',', hardline], vals(path, recur))]));
      case 'NamedSelect':
        return group(join(' ', vals(path, recur)));
      case 'JoinType':
        return node.value;
      case 'JoinOn':
        return ['ON', ' ', join(line, vals(path, recur))];
      case 'JoinUsing':
        return ['USING', ' ', join(line, vals(path, recur))];
      case 'Join':
        return node.values.length === 3
          ? [nthVal(0, path, recur), ' ', nthVal(1, path, recur), indent([line, nthVal(2, path, recur)])]
          : [nthVal(0, path, recur), indent([line, nthVal(1, path, recur)])];
      case 'FromList':
        return group(join([',', line], vals(path, recur)));
      case 'From':
        return ['FROM', group(indent([line, join(line, vals(path, recur))]))];
      case 'Where':
        return ['WHERE', indent([line, join(line, vals(path, recur))])];
      case 'GroupBy':
        return ['GROUP BY', indent([line, join([',', line], vals(path, recur))])];
      case 'Having':
        return ['HAVING', indent([line, join(line, vals(path, recur))])];
      case 'CombinationType':
        return node.value;
      case 'Combination':
        return [
          line,
          nthVal(0, path, recur),
          softline,
          line,
          ...(isDistinct(node.values[1])
            ? [group(['SELECT', line, nthVal(1, path, recur)]), group([join(line, tailVals(2, path, recur))])]
            : ['SELECT', group(join(line, tailVals(1, path, recur)))]),
        ];
      case 'OrderDirection':
        return node.value;
      case 'OrderByItem':
        return group(join(line, vals(path, recur)));
      case 'OrderBy':
        return ['ORDER BY', indent([line, group(join([',', line], vals(path, recur)))])];
      case 'Limit':
        return group(['LIMIT', line, nthVal(0, path, recur)]);
      case 'LimitAll':
        return 'ALL';
      case 'Offset':
        return group(['OFFSET', line, nthVal(0, path, recur)]);
      case 'Select':
        return wrapSubquery(
          path,
          isDistinct(node.values[0])
            ? group([group(['SELECT', line, nthVal(0, path, recur)]), group(join(line, tailVals(1, path, recur)))])
            : group(['SELECT', group(join(line, vals(path, recur)))]),
        );
      case 'Default':
        return 'DEFAULT';
      case 'SetItem':
        return [nthVal(0, path, recur), ' ', '=', ' ', nthVal(1, path, recur)];
      case 'SetList':
        return group(join([',', hardline], vals(path, recur)));
      case 'Columns':
        const parent = path.getParentNode();
        const columnsSeparator = parent && isInsert(parent) ? hardline : line;
        return group(['(', indent([softline, join([',', columnsSeparator], vals(path, recur))]), softline, ')']);
      case 'Values':
        return group(['(', indent([softline, join([',', line], vals(path, recur))]), softline, ')']);
      case 'SetMap':
        return group([
          nthVal(0, path, recur),
          line,
          group(['=', line, indent(group([softline, nthVal(1, path, recur)]))]),
        ]);
      case 'Set':
        return ['SET', indent([line, join(line, vals(path, recur))])];
      case 'QualifiedIdentifier':
        return group(join('.', vals(path, recur)));
      case 'Table':
        return group(join(line, vals(path, recur)));
      case 'UpdateFrom':
        return ['FROM', group(indent([line, join(line, vals(path, recur))]))];
      case 'ReturningListItem':
        return group(join(' ', vals(path, recur)));
      case 'Returning':
        return ['RETURNING', indent([line, join([',', hardline], vals(path, recur))])];
      case 'Update':
        return wrapSubquery(path, group(['UPDATE', group([' ', join(line, vals(path, recur))])]));
      case 'Using':
        return ['USING', group(indent([line, join(hardline, vals(path, recur))]))];
      case 'Delete':
        return wrapSubquery(path, group(['DELETE FROM', group([' ', join(line, vals(path, recur))])]));
      case 'ValuesList':
        return ['VALUES', group(indent([line, join([',', hardline], vals(path, recur))]))];
      case 'Collate':
        return group(['COLLATE', line, node.value]);
      case 'ConflictTargetIndex':
        return group(join(line, vals(path, recur)));
      case 'ConflictTarget':
        const indexes = filterIndexes(node.values, isConflictTargetIndex);
        const where = node.values.findIndex(isWhere);
        return group([
          '(',
          indent([
            softline,
            indexes.length
              ? join(
                  [',', line],
                  indexes.map((index) => nthVal(index, path, recur)),
                )
              : [],
          ]),
          ')',
          where !== -1 ? [line, nthVal(where, path, recur)] : [],
        ]);
      case 'ConflictConstraint':
        return group(['ON CONSTRAINT', line, node.value]);
      case 'DoNothing':
        return 'DO NOTHING';
      case 'DoUpdate':
        return group(['DO UPDATE', group(indent([line, join(line, vals(path, recur))]))]);
      case 'Conflict':
        return ['ON CONFLICT', group(indent([line, join(hardline, vals(path, recur))]))];
      case 'Insert':
        return wrapSubquery(path, [
          [group(['INSERT INTO', line, nthVal(0, path, recur)]), ' ', nthVal(1, path, recur)],
          group([line, join(line, tailVals(2, path, recur))]),
        ]);
      case 'WrappedExpression':
        return group([
          '(',
          group(indent([softline, nthVal(0, path, recur)])),
          softline,
          ')',
          ...(node.values.length === 2 ? [nthVal(1, path, recur)] : []),
        ]);
      case 'TableWithJoin':
        return group(['(', indent([softline, join(line, vals(path, recur))]), softline, ')']);
      case 'ExpressionList':
        return join([',', line], vals(path, recur));
      case 'Begin':
        return 'BEGIN';
      case 'Commit':
        return 'COMMIT';
      case 'Savepoint':
        return group(['SAVEPOINT', line, nthVal(0, path, recur)]);
      case 'Rollback':
        return node.values.length ? group(['ROLLBACK TO', line, nthVal(0, path, recur)]) : 'ROLLBACK';
    }
  },
  printComment: (path) => {
    const node = path.getValue();
    return node.tag === 'Comment' ? `--${node.value}` : '';
  },
  canAttachComment: (node) => node.tag && node.tag !== 'Comment',
};

const pgsqlParse: Parser<Node> = {
  parse: (text) => {
    const { ast, comments } = parser(text);
    return { value: ast, tag: 'Ast', comments, start: 0, end: text.length };
  },
  astFormat: 'pgsql-ast',
  locStart: (node) => node?.start,
  locEnd: (node) => node?.end,
};

const plugin: Plugin<Node> = {
  printers: { 'pgsql-ast': pgsqlAst },
  languages: [{ extensions: ['.sql'], name: 'SQL', parsers: ['pgsql-parse'], vscodeLanguageIds: ['sql'] }],
  parsers: { 'pgsql-parse': pgsqlParse },
};

export const printers = plugin.printers;
export const parsers = plugin.parsers;
export const languages = plugin.languages;
