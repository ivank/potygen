/**
 * formatters.ts
 *
 * Formatters to display introspection data.
 */

import { isNil, isUnique } from '../util';
import { isTypeNullable } from '../query-interface.guards';
import { Type } from '../query-interface.types';
import {
  LoadedDataTable,
  LoadedDataView,
  LoadedSource,
  LoadedDataEnum,
  LoadedDataComposite,
  LoadedFunction,
} from '../load.types';

const join = (separator: string, parts: (string | undefined)[]) => parts.filter(isNil).join(separator);

const wrap =
  (side: string) =>
  (text?: string): string | undefined =>
    text !== undefined ? side + text + side : undefined;

const code = wrap('`');
const bold = wrap('**');
const tableRow = wrap('|');
const formatSql = (text: string) => `\`\`\`sql\n${text}\n\`\`\``;

const markdownTable = (rows: string[][]): string => rows.map((row) => tableRow(row.join('|'))).join('\n');

const formatSourceName = (source: LoadedSource): string => {
  switch (source.type) {
    case 'Query':
    case 'Values':
    case 'Recordset':
      return `${source.name} ${code(source.type)}`;
    case 'Table':
    case 'View':
      const name = join('.', [source.schema === 'public' ? undefined : source.schema, source.table]);
      return `${join(' AS ', [name, source.table === source.name ? undefined : source.name])} ${source.type}`;
  }
};

const formatPostgresType = (type: string): string => {
  switch (type) {
    case 'time with time zone':
      return 'timetz';
    case 'time without time zone':
      return 'time';
    case 'timestamp without time zone':
      return 'timestamp';
    case 'timestamp with time zone':
      return 'timestamptz';
    default:
      return type;
  }
};

const formatSourceColumns = (source: LoadedSource): string =>
  markdownTable([
    ['Name', 'Type'],
    ['---', '---'],
    ...Object.entries(source.items).flatMap(([name, type]) => {
      const isNotNull = type && isTypeNullable(type) && !type.nullable;
      return [
        [
          name,
          join(
            ' ',
            [
              bold(formatPostgresType(type.postgresType)),
              code(isNotNull ? 'NOT_NULL' : 'NULL'),
              type.generated ? code('GENERATED') : undefined,
            ].filter(isNil),
          ),
        ],
        ...(type.postgresDescription
          ? type.postgresDescription
              .trim()
              .split('\n')
              .map((line) => ['', line])
          : []),
        ...(type.comment
          ? type.comment
              .trim()
              .split('\n')
              .map((line) => ['', line])
          : []),
      ];
    }),
  ]);

const formatComposite = (source: LoadedDataComposite): string =>
  markdownTable([
    ['Name', 'Type'],
    ['---', '---'],
    ...source.data
      .filter(isUnique((item) => item.name))
      .map((item) => [
        item.name,
        join(' ', [bold(formatPostgresType(item.type)), code(item.isNullable ? 'NULL' : 'NOT_NULL')]),
      ]),
  ]);

const formatEnum = (dataEnum: LoadedDataEnum): string =>
  join('\n\n---\n\n', [
    dataEnum.comment,
    markdownTable([['Variants'], ['---'], ...dataEnum.data.filter(isUnique()).map((variant) => [variant])]),
  ]);

export const quickInfoColumn = (
  source: LoadedSource,
  name: string,
  type: Type,
  details?: LoadedDataEnum | LoadedDataComposite,
): { display: string; description: string } => {
  const isNotNull = type && isTypeNullable(type) && !type.nullable;
  return {
    display: join(' ', [
      name,
      formatPostgresType(type?.postgresType),
      type.generated ? 'GENERATED' : undefined,
      isNotNull ? 'NOT NULL' : undefined,
    ]),
    description: join('\n\n---\n\n', [
      `From: ${formatSourceName(source)}`,
      type?.comment,
      type?.postgresDescription,
      details?.type === 'Enum'
        ? formatEnum(details)
        : details?.type === 'Composite'
        ? formatComposite(details)
        : undefined,
    ]),
  };
};

export const quickInfoEnum = (dataEnum: LoadedDataEnum): { display: string; description: string } => ({
  display: 'Enum',
  description: formatEnum(dataEnum),
});

export const quickInfoFunction = (dataFunc: LoadedFunction): { display: string; description: string } => ({
  display: `${dataFunc.name} (${dataFunc.argTypes
    .map((type) => formatPostgresType(type.postgresType))
    .join(', ')}): ${formatPostgresType(dataFunc.returnType.postgresType)}`,
  description: dataFunc.comment ?? '',
});

export const quickInfoSource = (source: LoadedSource): { display: string; description: string } => ({
  display: formatSourceName(source),
  description: formatSourceColumns(source),
});

export const quickInfoTable = (
  source: LoadedSource,
  table: LoadedDataTable,
): { display: string; description: string } => ({
  display: formatSourceName(source),
  description: join('\n\n---\n\n', [table.comment, formatSourceColumns(source)]),
});

export const quickInfoView = (
  source: LoadedSource,
  view: LoadedDataView,
): { display: string; description: string } => ({
  display: formatSourceName(source),
  description: join('\n\n---\n\n', [view.comment, formatSourceColumns(source), formatSql(view.data)]),
});
