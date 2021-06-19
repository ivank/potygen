import { SelectListTag, SelectTag, SqlTag } from './sql.types';
import { SqlGrammar } from './sql.grammar';
import { Parser } from '@ikerin/rd-parse';
import { document, printDocument, DocumentContext, Type } from '@ovotech/ts-compose';

const parser = Parser<SelectTag>(SqlGrammar);

const isSelectListTag = (item: SqlTag): item is SelectListTag => item.tag === 'SelectList';

export const convert = (context: DocumentContext, selectTag: SelectTag) => {
  const selectList = selectTag.values.filter(isSelectListTag)[0];

  return document(
    context,
    Type.Interface({
      name: 'Query',
      isExport: true,
      props: selectList.values.map(({ value }, index) => {
        switch (value.tag) {
          case 'SelectIdentifier':
            const lastName = value.values[value.values.length - 1];
            return Type.Prop({ name: lastName.tag === 'StarIdentifier' ? 'all' : lastName.value, type: Type.String });
          default:
            return Type.Prop({ name: 'prop' + index, type: Type.String });
        }
      }),
    }),
  );
};

export interface Tag {
  params: unknown[];
  result: unknown[];
}

export const sql = <T>(templateStrings: TemplateStringsArray) => {
  console.log(templateStrings);
  return '123';
};

export const sqlTs = async (sql: string): Promise<string> => {
  const tag = parser(sql);
  return printDocument(convert({}, tag!));
};
