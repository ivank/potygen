import { doc, Doc, Plugin, AstPath } from 'prettier';
import {
  parser,
  AstTag,
  CommentTag,
  SqlTag,
  Tag,
  isDistinct,
  range,
  isBinaryExpression,
  isFunctionArg,
  isOrderBy,
  isFilter,
  isWhere,
  isWith,
  isInsert,
} from '@potygen/ast';
import { isConflictTargetIndex } from '@potygen/ast/dist/grammar.guards';

const { line, softline, indent, join, group } = doc.builders;

interface RootAstTag extends SqlTag {
  tag: 'Ast';
  value: AstTag;
  comments: CommentTag[];
}

export const isRootAstTag = (value: SqlTag): value is RootAstTag => value.tag === 'Ast';

const wrapSubquery = (path: AstPath<any>, content: Doc): Doc => {
  const parent = path.getParentNode();
  return parent && (isRootAstTag(parent) || isWith(parent) || isInsert(parent))
    ? content
    : group(['(', indent([softline, content]), softline, ')']);
};

const values = (path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] => path.map(print, 'values');

const first = (path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc => path.call(print, 'values', 0);

const nth = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc =>
  path.call(print, 'values', num);

const last = (path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc =>
  path.call(print, 'values', path.getValue().values.length - 1);

const initial = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] =>
  range(0, path.getValue().values.length - num).map((index) => path.call(print, 'values', index));

const tail = (num: number, path: AstPath<any>, print: (path: AstPath<any>) => Doc): Doc[] =>
  range(num, path.getValue().values.length).map((index) => path.call(print, 'values', index));

const filterIndexes = <T>(items: T[], predicate: (item: T) => boolean): number[] =>
  items.reduce<number[]>((acc, item, index) => (predicate(item) ? [...acc, index] : acc), []);

const plugin: Plugin<RootAstTag | Tag | CommentTag> = {
  printers: {
    'pgsql-ast': {
      print: (path, options, recur) => {
        const node = path.getValue();

        switch (node.tag) {
          case 'Ast':
            return [path.call(recur, 'value'), softline];
          case 'Comment':
            return `-- ${node.value}`;
          case 'CTEName':
            return join(line, values(path, recur));
          case 'CTEValuesList':
            return group([
              '(',
              indent([softline, 'VALUES', group(indent([line, join([',', line], values(path, recur))]))]),
              softline,
              ')',
            ]);
          case 'CTEValues':
            return group(['(', indent([softline, join([',', line], values(path, recur))]), ')']);
          case 'CTE':
            return group([first(path, recur), line, 'AS', line, nth(1, path, recur)]);
          case 'With':
            return group(['WITH', indent([line, join([',', line], initial(1, path, recur))]), line, last(path, recur)]);
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
                ? group(['(', indent([softline, join([',', line], path.map(recur, 'pick'))]), softline, ')'])
                : '',
              node.required ? '!' : '',
            ];
          case 'Column':
            return group(join('.', values(path, recur)));
          case 'As':
            return group(['AS', line, join(line, values(path, recur))]);
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
            return join(' ', values(path, recur));
          case 'ExtractField':
            return node.value;
          case 'Extract':
            return group([
              'EXTRACT',
              indent([line, '(', group([first(path, recur), line, 'FROM']), line, nth(1, path, recur)]),
              ')',
            ]);
          case 'ArrayIndexRange':
            return group(join(':', values(path, recur)));
          case 'ArrayIndex':
            return group([
              group(['(', first(path, recur), ')', softline]),
              '[',
              indent([softline, nth(1, path, recur)]),
              ']',
            ]);
          case 'CompositeAccess':
            return group(['(', indent([softline, first(path, recur)]), ')', '.', nth(1, path, recur)]);
          case 'Count':
            return values(path, recur);
          case 'Dimension':
            return '[]';
          case 'Type':
            return node.values.length === 1
              ? first(path, recur)
              : node.values.length === 2
              ? [first(path, recur), '(', nth(1, path, recur), ')']
              : [first(path, recur), '(', nth(1, path, recur), ',', nth(2, path, recur), ')'];
          case 'TypeArray':
            return values(path, recur);
          case 'Distinct':
            return node.values.length
              ? ['DISTINCT ON (', group([indent([softline, join([',', line], values(path, recur))]), softline]), ')']
              : ['DISTINCT'];
          case 'Filter':
            return [group(['FILTER', line]), group(['(', indent([softline, first(path, recur)]), ')'])];
          case 'Star':
            return '*';
          case 'StarIdentifier':
            return group(join('.', values(path, recur)));
          case 'Row':
            return [
              group(['ROW', line]),
              group(['(', indent([softline, join([',', line], values(path, recur))]), softline, ')']),
            ];
          case 'When':
            return [
              group([
                group(['WHEN', indent([line, first(path, recur)])]),
                indent([line, group(['THEN', line, nth(1, path, recur)])]),
              ]),
            ];
          case 'Else':
            return group(['ELSE', line, first(path, recur)]);
          case 'CaseSimple':
            return group([
              group(['CASE', line, first(path, recur)]),
              indent([line, join(line, tail(1, path, recur))]),
              line,
              'END',
            ]);
          case 'Case':
            return group(['CASE', indent([line, join(line, values(path, recur))]), line, 'END']);
          case 'BinaryOperator':
            return node.value;
          case 'UnaryOperator':
            return node.value;
          case 'ComparationOperator':
            return node.value;
          case 'ComparationType':
            return node.value;
          case 'UnaryExpression':
            return join(['+', '-'].includes(node.values[0].value) ? '' : ' ', values(path, recur));
          case 'BinaryExpression':
            return group(
              [first(path, recur), line, group([nth(1, path, recur), indent([line, nth(2, path, recur)])])],
              {
                shouldBreak: node.values.some(isBinaryExpression),
              },
            );
          case 'TernaryOperator':
            return node.value;
          case 'TernarySeparator':
            return node.value;
          case 'TernaryExpression':
            return group([
              first(path, recur),
              indent([
                line,
                group([nth(1, path, recur), line, nth(2, path, recur)]),
                line,
                group([nth(3, path, recur), line, nth(4, path, recur)]),
              ]),
            ]);
          case 'Cast':
            return group([
              group(['CAST', line]),
              '(',
              indent([line, first(path, recur), line, group(['AS', line, nth(1, path, recur)])]),
              line,
              ')',
            ]);
          case 'PgCast':
            return group(join('::', values(path, recur)));
          case 'ArrayConstructor':
            return group([
              group(['ARRAY', softline, '[']),
              indent([softline, join([',', line], values(path, recur))]),
              softline,
              ']',
            ]);
          case 'Function':
            const args = filterIndexes(node.values, isFunctionArg);
            const distinct = node.values.findIndex(isDistinct);
            const order = node.values.findIndex(isOrderBy);
            const filter = node.values.findIndex(isFilter);
            const isNoBrackets = ['CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP'].includes(
              node.values[0].values[0].value,
            );

            return group([
              group([first(path, recur), softline, isNoBrackets ? '' : '(']),
              indent([
                softline,
                distinct !== -1 ? [nth(distinct, path, recur), line] : [],
                join(
                  [',', line],
                  args.map((index) => nth(index, path, recur)),
                ),
                order !== -1 ? [line, nth(order, path, recur)] : [],
              ]),
              softline,
              isNoBrackets ? '' : ')',
              filter !== -1 ? [line, nth(filter, path, recur)] : [],
            ]);
          case 'ComparationExpression':
            return node.values.length === 4
              ? [
                  first(path, recur),
                  ' ',
                  nth(1, path, recur),
                  ' ',
                  nth(2, path, recur),
                  ' ',
                  '(',
                  nth(3, path, recur),
                  ')',
                ]
              : join(' ', values(path, recur));
          case 'SelectListItem':
            return group(join(' ', values(path, recur)));
          case 'SelectList':
            return group(indent([line, join([',', line], values(path, recur))]));
          case 'NamedSelect':
            return group(join(' ', values(path, recur)));
          case 'JoinType':
            return node.value;
          case 'JoinOn':
            return ['ON', ' ', join(line, values(path, recur))];
          case 'JoinUsing':
            return ['USING', ' ', join(line, values(path, recur))];
          case 'Join':
            return node.values.length === 3
              ? [first(path, recur), ' ', nth(1, path, recur), indent([line, nth(2, path, recur)])]
              : [first(path, recur), indent([line, nth(1, path, recur)])];
          case 'FromList':
            return group(join([',', line], values(path, recur)));
          case 'From':
            return group(['FROM', group(indent([line, join(line, values(path, recur))]))]);
          case 'Where':
            return group(['WHERE', indent([line, join(line, values(path, recur))])]);
          case 'GroupBy':
            return group(['GROUP BY', indent([line, join([',', line], values(path, recur))])]);
          case 'Having':
            return group(['HAVING', indent([line, join(line, values(path, recur))])]);
          case 'CombinationType':
            return node.value;
          case 'Combination':
            return [
              line,
              first(path, recur),
              softline,
              line,
              ...(isDistinct(node.values[1])
                ? [group(['SELECT', line, nth(1, path, recur)]), group([join(line, tail(2, path, recur))])]
                : ['SELECT', group(join(line, tail(1, path, recur)))]),
            ];
          case 'OrderDirection':
            return node.value;
          case 'OrderByItem':
            return group(join(line, values(path, recur)));
          case 'OrderBy':
            return group(['ORDER BY', indent([line, group(join([',', line], values(path, recur)))])]);
          case 'Limit':
            return group(['LIMIT', line, first(path, recur)]);
          case 'LimitAll':
            return 'ALL';
          case 'Offset':
            return group(['OFFSET', line, first(path, recur)]);
          case 'Select':
            return wrapSubquery(
              path,
              isDistinct(node.values[0])
                ? group([group(['SELECT', line, first(path, recur)]), group(join(line, tail(1, path, recur)))])
                : group(['SELECT', group(join(line, values(path, recur)))]),
            );
          case 'Default':
            return 'DEFAULT';
          case 'SetItem':
            return [first(path, recur), ' ', '=', ' ', nth(1, path, recur)];
          case 'SetList':
            return group(join([',', line], values(path, recur)));
          case 'Columns':
            return group(['(', indent([softline, join([',', line], values(path, recur))]), softline, ')']);
          case 'Values':
            return group(['(', indent([softline, join([',', line], values(path, recur))]), ')']);
          case 'SetMap':
            return group([
              first(path, recur),
              line,
              group(['=', line, indent(group([softline, nth(1, path, recur)]))]),
            ]);
          case 'Set':
            return group(['SET', indent([line, join(line, values(path, recur))])]);
          case 'QualifiedIdentifier':
            return group(join('.', values(path, recur)));
          case 'Table':
            return group(join(line, values(path, recur)));
          case 'UpdateFrom':
            return group(['FROM', group(indent([line, join(line, values(path, recur))]))]);
          case 'ReturningListItem':
            return group(join(' ', values(path, recur)));
          case 'Returning':
            return group(['RETURNING', group(indent([line, join([',', line], values(path, recur))]))]);
          case 'Update':
            return wrapSubquery(path, group(['UPDATE', group([' ', join(line, values(path, recur))])]));
          case 'Using':
            return group(['USING', group(indent([line, join(line, values(path, recur))]))]);
          case 'Delete':
            return wrapSubquery(path, group(['DELETE FROM', group([' ', join(line, values(path, recur))])]));
          case 'ValuesList':
            return group(['VALUES', group(indent([line, join([',', line], values(path, recur))]))]);
          case 'Collate':
            return group(['COLLATE', line, node.value]);
          case 'ConflictTargetIndex':
            return group(join(line, values(path, recur)));
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
                      indexes.map((index) => nth(index, path, recur)),
                    )
                  : [],
              ]),
              ')',
              where !== -1 ? [line, nth(where, path, recur)] : [],
            ]);
          case 'ConflictConstraint':
            return group(['ON CONSTRAINT', line, node.value]);
          case 'DoNothing':
            return 'DO NOTHING';
          case 'DoUpdate':
            return group(['DO UPDATE', group(indent([line, join(line, values(path, recur))]))]);
          case 'Conflict':
            return group(['ON CONFLICT', group(indent([line, join(line, values(path, recur))]))]);
          case 'Insert':
            return wrapSubquery(
              path,
              group([
                [['INSERT INTO', ' ', first(path, recur)], ' ', nth(1, path, recur)],
                group([line, join(line, tail(2, path, recur))]),
              ]),
            );
          case 'WrappedExpression':
            return group(['(', indent([softline, join(line, values(path, recur))]), softline, ')']);
          case 'TableWithJoin':
            return group(['(', indent([softline, join(line, values(path, recur))]), softline, ')']);
          case 'ExpressionList':
            return join([',', line], values(path, recur));
          case 'Begin':
            return 'BEGIN';
          case 'Commit':
            return 'COMMIT';
          case 'Savepoint':
            return group(['SAVEPOINT', line, first(path, recur)]);
          case 'Rollback':
            return node.values.length ? group(['ROLLBACK TO', line, first(path, recur)]) : 'ROLLBACK';
        }
      },
      printComment: (path) => {
        const node = path.getValue();
        return node.tag === 'Comment' ? `--${node.value}` : '';
      },
      canAttachComment: (node) => node.tag && node.tag !== 'Comment',
    },
  },
  languages: [
    {
      extensions: ['.pgsql'],
      name: 'SQL',
      parsers: ['pgsql-parse'],
    },
  ],
  parsers: {
    'pgsql-parse': {
      parse: (text) => {
        const { ast, comments } = parser(text);
        return { value: ast, tag: 'Ast', comments, start: 0, end: text.length };
      },
      astFormat: 'pgsql-ast',
      locStart: (node) => node?.start,
      locEnd: (node) => node?.end,
    },
  },
};

export default plugin;
