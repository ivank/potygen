import { QueryInterface, isColumnType, ColumnType, StarType, isStarType, toConstantType } from './query-interface';
import { ClientBase, QueryConfig } from 'pg';
import { isEmpty } from './util';

// export interface LoadedProperty {
//   name: string;
//   type: ConstantType;
// }

// export interface LoadedParam {
//   name: string;
//   type: ConstantType;
// }

// export interface LoadedQueryInterface {
//   params: LoadedParam[];
//   result: LoadedProperty[];
// }

const infoQuery = (columnTypes: ColumnType[], starTypes: StarType[]): QueryConfig => ({
  name: 'info-query',
  text: `
    SELECT
      table_schema AS "schema",
      table_name AS "table",
      column_name AS "column",
      is_nullable AS "isNullable",
      data_type AS "dataType"
    FROM information_schema.columns
    WHERE
      ${
        isEmpty(columnTypes)
          ? 'FALSE'
          : `(table_schema, table_name, column_name) IN (${columnTypes
              .map((_, index) => `(\$${index * 3 + 1},\$${index * 3 + 2},\$${index * 3 + 3})`)
              .join(',')})`
      }
      OR
      ${
        isEmpty(starTypes)
          ? 'FALSE'
          : `(table_schema, table_name) IN (${starTypes
              .map((_, index) => `(\$${index * 2 + 1},\$${index * 2 + 2})`)
              .join(',')})`
      }
  `,
  values: columnTypes.flatMap(({ schema = 'public', table, column }) => [schema, table, column]),
});

interface Info {
  schema: string;
  table: string;
  column: string;
  isNullable: 'YES' | 'NO';
  dataType: string;
}

const matchesColumnType = (columnType: ColumnType) => (info: Info): boolean =>
  columnType.column === info.column && columnType.schema === info.schema && columnType.table === info.table;
const matchesStarType = (columnType: StarType) => (info: Info): boolean =>
  columnType.schema === info.schema && columnType.table === info.table;

export const loadTypes = async (db: ClientBase, { params, result }: QueryInterface): Promise<QueryInterface> => {
  const columnTypes = params
    .map((item) => item.type)
    .filter(isColumnType)
    .concat(result.map((item) => item.type).filter(isColumnType));
  const starTypes = result.map((item) => item.type).filter(isStarType);

  try {
    const info =
      columnTypes.length || starTypes.length ? (await db.query<Info>(infoQuery(columnTypes, starTypes))).rows : [];

    return {
      params: params.map((item) => {
        const type = item.type;
        return isColumnType(type)
          ? { ...item, type: toConstantType(info.find(matchesColumnType(type))?.dataType) }
          : item;
      }),
      result: result.flatMap((item) => {
        const type = item.type;

        if (isColumnType(type)) {
          return { ...item, type: toConstantType(info.find(matchesColumnType(type))?.dataType) };
        } else if (isStarType(type)) {
          return info
            .filter(matchesStarType(type))
            .map((info) => ({ name: info.column, type: toConstantType(info.dataType) }));
        } else {
          return item;
        }
      }),
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
