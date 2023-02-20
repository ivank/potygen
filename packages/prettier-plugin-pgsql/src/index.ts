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
  last,
  isParameter,
  isConflictTargetIndex,
  SqlName,
  isComment,
  BinaryOperatorTag,
  isSpreadParameter,
  isSelect,
  isTransactionSessionCharacteristics,
} from '@potygen/potygen';

const { line, softline, indent, join, group, hardline } = doc.builders;

interface RootTag extends SqlTag {
  tag: SqlName.Root;
  value: AstTag;
  comments: CommentTag[];
  start: number;
  end: number;
}

type Node = RootTag | Tag | CommentTag;

const isRootAstTag = (value: SqlTag): value is RootTag => value.tag === SqlName.Root;

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

const compactBinaryOperators: Array<BinaryOperatorTag['value']> = ['->>', '->'];

const pgsqlAst: Printer<Node> = {
  print: (path, options, recur) => {
    const node = path.getValue();

    if (isRootAstTag(node)) {
      return [path.call(recur, 'value'), softline];
    }

    switch (node.tag) {
      case SqlName.Comment:
        return `-- ${node.value}`;
      case SqlName.CTEName:
        return group(join(line, vals(path, recur)));
      case SqlName.CTEValuesList:
        return group([
          '(',
          indent([softline, 'VALUES', group(indent([line, join([',', line], vals(path, recur))]))]),
          softline,
          ')',
        ]);
      case SqlName.CTEValues:
        return group(['(', indent([softline, join([',', line], vals(path, recur))]), ')']);
      case SqlName.CTE:
        return group([group([nthVal(0, path, recur), line, 'AS']), line, nthVal(1, path, recur)]);
      case SqlName.With:
        return wrapSubquery(
          path,
          group([
            'WITH',
            indent([line, join([',', line], initialVals(1, path, recur))]),
            line,
            nthVal(-1, path, recur),
          ]),
        );
      case SqlName.Null:
        return 'NULL';
      case SqlName.UnquotedIdentifier:
        return node.value;
      case SqlName.QuotedIdentifier:
        return `"${node.value}"`;
      case SqlName.ParameterPick:
        return join('::', vals(path, recur));
      case SqlName.ParameterRequired:
        return '!';
      case SqlName.ParameterIdentifier:
        return join('', vals(path, recur));
      case SqlName.SpreadParameter:
      case SqlName.Parameter:
        return [
          node.tag === SqlName.SpreadParameter ? '$$' : '$',
          nthVal(0, path, recur),
          node.values[1]
            ? group(['(', indent([softline, join([',', hardline], tailVals(1, path, recur))]), softline, ')'])
            : '',
        ];
      case SqlName.Column:
        return group(join('.', vals(path, recur)));
      case SqlName.As:
        return group(['AS', line, join(line, vals(path, recur))]);
      case SqlName.String:
        return `'${node.value}'`;
      case SqlName.DollarQuotedString:
        return `\$\$${node.value}\$\$`;
      case SqlName.CustomQuotedString:
        return `\$${node.delimiter}\$${node.value}\$${node.delimiter}\$`;
      case SqlName.BitString:
        return `B'${node.value}'`;
      case SqlName.HexadecimalString:
        return `X'${node.value}'`;
      case SqlName.EscapeString:
        return `E'${node.value}'`;
      case SqlName.Number:
        return node.value;
      case SqlName.Integer:
        return node.value;
      case SqlName.Boolean:
        return node.value;
      case SqlName.ConstantType:
        return node.value;
      case SqlName.TypedConstant:
        return join(' ', vals(path, recur));
      case SqlName.ExtractField:
        return node.value;
      case SqlName.Extract:
        return group([
          'EXTRACT',
          indent([line, '(', group([nthVal(0, path, recur), line, 'FROM']), line, nthVal(1, path, recur)]),
          ')',
        ]);
      case SqlName.ArrayIndexRange:
        return group(join(':', vals(path, recur)));
      case SqlName.ArrayColumnIndex:
        return group([
          group([nthVal(0, path, recur), softline]),
          ...tailVals(1, path, recur).map((item) => ['[', indent([softline, item]), ']']),
        ]);
      case SqlName.ArrayIndex:
        return group(vals(path, recur).map((item) => ['[', indent([softline, item]), ']']));
      case SqlName.CompositeAccess:
        return group(['.', vals(path, recur)]);
      case SqlName.Count:
        return vals(path, recur);
      case SqlName.Dimension:
        return '[]';
      case SqlName.Type:
        return node.values.length === 1
          ? nthVal(0, path, recur)
          : node.values.length === 2
          ? [nthVal(0, path, recur), '(', nthVal(1, path, recur), ')']
          : [nthVal(0, path, recur), '(', nthVal(1, path, recur), ',', nthVal(2, path, recur), ')'];
      case SqlName.ArrayType:
        return vals(path, recur);
      case SqlName.Distinct:
        return node.values.length
          ? ['DISTINCT ON (', group([indent([softline, join([',', line], vals(path, recur))]), softline]), ')']
          : ['DISTINCT'];
      case SqlName.Filter:
        return [group(['FILTER', line]), group(['(', indent([softline, nthVal(0, path, recur)]), softline, ')'])];
      case SqlName.Star:
        return '*';
      case SqlName.StarIdentifier:
        return group(join('.', vals(path, recur)));
      case SqlName.RowKeyword:
        return [
          group(['ROW', line]),
          group(['(', indent([softline, join([',', line], vals(path, recur))]), softline, ')']),
        ];
      case SqlName.Row:
        return group(['(', indent([softline, join([',', line], vals(path, recur))]), softline, ')']);
      case SqlName.When:
        return [
          group([
            group(['WHEN', indent([line, nthVal(0, path, recur)])]),
            indent([line, group(['THEN', line, nthVal(1, path, recur)])]),
          ]),
        ];
      case SqlName.Else:
        return group(['ELSE', line, nthVal(0, path, recur)]);
      case SqlName.CaseSimple:
        return group([
          group(['CASE', line, nthVal(0, path, recur)]),
          indent([line, join(line, tailVals(1, path, recur))]),
          line,
          'END',
        ]);
      case SqlName.Case:
        return group(['CASE', indent([line, join(line, vals(path, recur))]), line, 'END']);
      case SqlName.BinaryOperator:
        return node.value;
      case SqlName.UnaryOperator:
        return node.value;
      case SqlName.ComparisonArrayOperator:
        return node.value;
      case SqlName.ComparisonArrayType:
        return node.value;
      case SqlName.ComparisonArrayInclusionType:
        return node.value;
      case SqlName.UnaryExpression:
        return join(['+', '-'].includes(node.values[0].value) ? '' : ' ', vals(path, recur));
      case SqlName.BinaryExpression:
        const operatorMargin = compactBinaryOperators.includes(node.values[1].value) ? softline : line;
        return group([
          nthVal(0, path, recur),
          operatorMargin,
          group([nthVal(1, path, recur), indent([operatorMargin, nthVal(2, path, recur)])]),
        ]);
      case SqlName.TernaryOperator:
        return node.value;
      case SqlName.TernarySeparator:
        return node.value;
      case SqlName.TernaryExpression:
        return group([
          nthVal(0, path, recur),
          indent([
            line,
            group([nthVal(1, path, recur), line, nthVal(2, path, recur)]),
            line,
            group([nthVal(3, path, recur), line, nthVal(4, path, recur)]),
          ]),
        ]);
      case SqlName.Cast:
        return group([
          group(['CAST', line]),
          '(',
          indent([line, nthVal(0, path, recur), line, group(['AS', line, nthVal(1, path, recur)])]),
          line,
          ')',
        ]);
      case SqlName.PgCast:
        return group(join('::', vals(path, recur)));
      case SqlName.ArrayConstructor:
        return group([
          group(['ARRAY', softline, '[']),
          indent([softline, join([',', line], vals(path, recur))]),
          softline,
          ']',
        ]);
      case SqlName.ArraySelectConstructor:
        return group(['ARRAY', vals(path, recur)]);
      case SqlName.Function:
        const args = filterIndexes(node.values, isFunctionArg);
        const distinct = node.values.findIndex(isDistinct);
        const order = node.values.findIndex(isOrderBy);
        const filter = node.values.findIndex(isFilter);
        const name = node.values[0].values[0].value.toUpperCase();
        const isNoBrackets = ['CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP'].includes(name);
        const groupArgsByTwo = ['JSON_BUILD_OBJECT', 'JSONB_BUILD_OBJECT'].includes(name);

        return group([
          group([
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
          ]),
          filter !== -1 ? [line, nthVal(filter, path, recur)] : [],
        ]);
      case SqlName.ComparisonArray:
        return [
          nthVal(0, path, recur),
          ' ',
          nthVal(1, path, recur),
          ' ',
          nthVal(2, path, recur),
          '(',
          nthVal(3, path, recur),
          ')',
        ];
      case SqlName.ComparisonArrayInclusion:
        return [
          nthVal(0, path, recur),
          ' ',
          nthVal(1, path, recur),
          ' ',
          isParameter(last(node.values)) || isSpreadParameter(last(node.values)) || isSelect(last(node.values))
            ? nthVal(2, path, recur)
            : group(['(', nthVal(2, path, recur), ')']),
        ];
      case SqlName.Exists:
        return group(['EXISTS', ' ', join(' ', vals(path, recur))]);
      case SqlName.SelectListItem:
        return group(join(' ', vals(path, recur)));
      case SqlName.SelectList:
        return group(indent([line, join([',', hardline], vals(path, recur))]));
      case SqlName.NamedSelect:
        return group(join(' ', vals(path, recur)));
      case SqlName.JoinType:
        return node.value;
      case SqlName.JoinOn:
        return ['ON', ' ', join(line, vals(path, recur))];
      case SqlName.JoinUsing:
        return ['USING', ' ', join(line, vals(path, recur))];
      case SqlName.Join:
        return node.values.length === 3
          ? [nthVal(0, path, recur), ' ', nthVal(1, path, recur), indent([line, nthVal(2, path, recur)])]
          : [nthVal(0, path, recur), indent([line, nthVal(1, path, recur)])];
      case SqlName.FromList:
        return group(join([',', line], vals(path, recur)));
      case SqlName.SelectLock:
        return ['FOR', node.value];
      case SqlName.From:
        return ['FROM', group(indent([line, join(hardline, vals(path, recur))]))];
      case SqlName.Where:
        return ['WHERE', indent([line, join(line, vals(path, recur))])];
      case SqlName.GroupBy:
        return ['GROUP BY', indent([line, join([',', line], vals(path, recur))])];
      case SqlName.Having:
        return ['HAVING', indent([line, join(line, vals(path, recur))])];
      case SqlName.CombinationType:
        return node.value;
      case SqlName.Combination:
        return [
          line,
          nthVal(0, path, recur),
          softline,
          line,
          ...(isDistinct(node.values[1])
            ? [group(['SELECT', line, nthVal(1, path, recur)]), group([join(line, tailVals(2, path, recur))])]
            : ['SELECT', group(join(line, tailVals(1, path, recur)))]),
        ];
      case SqlName.OrderDirection:
        return node.value;
      case SqlName.OrderByItem:
        return group(join(line, vals(path, recur)));
      case SqlName.OrderBy:
        return ['ORDER BY', indent([line, group(join([',', line], vals(path, recur)))])];
      case SqlName.Limit:
        return group(['LIMIT', line, nthVal(0, path, recur)]);
      case SqlName.LimitAll:
        return 'ALL';
      case SqlName.Offset:
        return group(['OFFSET', line, nthVal(0, path, recur)]);
      case SqlName.Select:
        return wrapSubquery(
          path,
          isDistinct(node.values[0])
            ? group([group(['SELECT', line, nthVal(0, path, recur)]), group(join(line, tailVals(1, path, recur)))])
            : group(['SELECT', group(join(line, vals(path, recur)))]),
        );
      case SqlName.Default:
        return 'DEFAULT';
      case SqlName.SetItem:
        return [nthVal(0, path, recur), ' ', '=', ' ', nthVal(1, path, recur)];
      case SqlName.SetArrayItem:
        return [nthVal(0, path, recur), '[', nthVal(1, path, recur), ']', ' ', '=', ' ', nthVal(2, path, recur)];
      case SqlName.SetList:
        return group(join([',', hardline], vals(path, recur)));
      case SqlName.Columns:
        const columnsParent = path.getParentNode();
        const columnsSeparator = columnsParent && isInsert(columnsParent) ? hardline : line;
        return group(['(', indent([softline, join([',', columnsSeparator], vals(path, recur))]), softline, ')']);
      case SqlName.Values:
        const valuesParent = path.getParentNode(1);
        const valuesSeparator = valuesParent && isInsert(valuesParent) ? hardline : line;
        return group(['(', indent([softline, join([',', valuesSeparator], vals(path, recur))]), softline, ')']);
      case SqlName.SetMap:
        return group([
          nthVal(0, path, recur),
          line,
          group(['=', line, indent(group([softline, nthVal(1, path, recur)]))]),
        ]);
      case SqlName.Set:
        return ['SET', indent([line, join(line, vals(path, recur))])];
      case SqlName.QualifiedIdentifier:
        return group(join('.', vals(path, recur)));
      case SqlName.Table:
        return group(join(line, vals(path, recur)));
      case SqlName.UpdateFrom:
        return ['FROM', group(indent([line, join(line, vals(path, recur))]))];
      case SqlName.ReturningListItem:
        return group(join(' ', vals(path, recur)));
      case SqlName.Returning:
        return ['RETURNING', indent([line, join([',', hardline], vals(path, recur))])];
      case SqlName.Update:
        return wrapSubquery(path, group(['UPDATE', group([' ', join(line, vals(path, recur))])]));
      case SqlName.Using:
        return ['USING', group(indent([line, join(hardline, vals(path, recur))]))];
      case SqlName.Delete:
        return wrapSubquery(path, group(['DELETE FROM', group([' ', join(line, vals(path, recur))])]));
      case SqlName.ValuesList:
        return ['VALUES', group(indent([line, join([',', hardline], vals(path, recur))]))];
      case SqlName.Collate:
        return group(['COLLATE', line, node.value]);
      case SqlName.ConflictTargetIndex:
        return group(join(line, vals(path, recur)));
      case SqlName.ConflictTarget:
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
          softline,
          ')',
          where !== -1 ? [line, nthVal(where, path, recur)] : [],
        ]);
      case SqlName.ConflictConstraint:
        return group(['ON CONSTRAINT', line, node.value]);
      case SqlName.DoNothing:
        return 'DO NOTHING';
      case SqlName.DoUpdate:
        return group(['DO UPDATE', group(indent([line, join(line, vals(path, recur))]))]);
      case SqlName.Conflict:
        return [
          group(['ON CONFLICT', indent([line, nthVal(0, path, recur)])]),
          node.values.length === 2 ? indent([line, nthVal(1, path, recur)]) : '',
        ];
      case SqlName.Insert:
        return wrapSubquery(path, [
          [group(['INSERT INTO', line, nthVal(0, path, recur)]), ' ', nthVal(1, path, recur)],
          group([line, join(line, tailVals(2, path, recur))]),
        ]);
      case SqlName.WrappedExpression:
        return group([
          '(',
          group(indent([softline, nthVal(0, path, recur)])),
          softline,
          ')',
          ...(node.values.length === 2 ? [nthVal(1, path, recur)] : []),
        ]);
      case SqlName.TableWithJoin:
        return group(['(', indent([softline, join(line, vals(path, recur))]), softline, ')']);
      case SqlName.ExpressionList:
        return group(join([',', line], vals(path, recur)));
      case SqlName.Begin:
        return node.values.length ? group(join(line, ['BEGIN', 'TRANSACTION', ...vals(path, recur)])) : 'BEGIN';
      case SqlName.TransactionSessionCharacteristics:
        return 'SESSION CHARACTERISTICS AS';
      case SqlName.SetTransaction:
        return isTransactionSessionCharacteristics(node.values[0])
          ? group(['SET', line, nthVal(0, path, recur), line, 'TRANSACTION', join(line, tailVals(1, path, recur))])
          : group(join(line, ['SET', 'TRANSACTION', ...vals(path, recur)]));
      case SqlName.TransactionDeferrable:
        return node.value === 'NOT' ? group(['NOT', line, 'DEFERRABLE']) : 'DEFERRABLE';
      case SqlName.TransactionIsolationLevel:
        return group(join(line, ['ISOLATION', 'LEVEL', node.value]));
      case SqlName.TransactionSnapshot:
        return group(['SNAPSHOT', line, vals(path, recur)]);
      case SqlName.TransactionReadWrite:
        return group(['READ', line, node.value]);
      case SqlName.Commit:
        return 'COMMIT';
      case SqlName.Savepoint:
        return group(['SAVEPOINT', line, nthVal(0, path, recur)]);
      case SqlName.Rollback:
        return node.values.length ? group(['ROLLBACK TO', line, nthVal(0, path, recur)]) : 'ROLLBACK';
      case SqlName.AsColumn:
        return group(join(' ', vals(path, recur)));
      case SqlName.AsColumnList:
        return group(join([',', line], vals(path, recur)));
      case SqlName.AsRecordset:
        return group([
          group(['AS', line, nthVal(0, path, recur), '(']),
          indent([softline, nthVal(1, path, recur)]),
          softline,
          ')',
        ]);
      case SqlName.RecordsetFunction:
        return group(join(line, vals(path, recur)));
      case SqlName.RecordsetValuesList:
        return group([
          '(',
          indent([softline, nthVal(0, path, recur)]),
          softline,
          ')',
          line,
          group(['AS', line, nthVal(1, path, recur), line]),
          nthVal(2, path, recur),
        ]);
    }
  },
  printComment: (path) => {
    const node = path.getValue();
    return isComment(node) ? `--${node.value}` : '';
  },
  canAttachComment: (node) => Boolean(node.tag && !isComment(node)),
};

const pgsqlParse: Parser<Node> = {
  parse: (text) => {
    const { ast, comments } = parser(text);
    return { value: ast, tag: SqlName.Root, comments, start: 0, end: text.length };
  },
  astFormat: 'sql',
  locStart: (node) => node?.start,
  locEnd: (node) => node?.end,
};

const plugin: Plugin<Node> = {
  printers: { sql: pgsqlAst },
  languages: [{ extensions: ['.sql'], name: 'SQL', parsers: ['sql'], vscodeLanguageIds: ['sql'] }],
  parsers: { sql: pgsqlParse },
};

export const printers = plugin.printers;
export const parsers = plugin.parsers;
export const languages = plugin.languages;
