import { document, printDocument, DocumentContext, Type, withIdentifier } from '@ovotech/ts-compose';
import { TypeNode } from 'typescript';
import { LoadedType, isLoadedArrayType, isLoadedUnionType, LoadedQuery } from './load-types';
import { isLiteralType } from './query-interface';

const toPropertyType = (type: LoadedType): TypeNode => {
  if (isLoadedArrayType(type)) {
    return Type.Array(toPropertyType(type.items));
  } else if (isLoadedUnionType(type)) {
    return Type.Union(type.items.map(toPropertyType));
  } else if (isLiteralType(type)) {
    return Type.Literal(type.value);
  } else {
    switch (type) {
      case 'Date':
        return Type.Referance('Date');
      case 'boolean':
        return Type.Boolean;
      case 'json':
        return Type.Unknown;
      case 'null':
        return Type.Null;
      case 'number':
        return Type.Number;
      case 'string':
        return Type.String;
      case 'unknown':
        return Type.Unknown;
    }
  }
};

export const toQuery = (context: DocumentContext, query: LoadedQuery) => {
  const paramsContext = withIdentifier(
    context,
    Type.Interface({
      name: 'QueryParams',
      isExport: true,
      props: query.params.map(({ name, type }) => Type.Prop({ name, type: toPropertyType(type) })),
    }),
  );

  const resultContext = withIdentifier(
    paramsContext,
    Type.Interface({
      name: 'QueryResult',
      isExport: true,
      props: query.result.map(({ name, type }) => Type.Prop({ name, type: toPropertyType(type) })),
    }),
  );

  return document(
    resultContext,
    Type.Interface({
      name: 'Query',
      isExport: true,
      props: [
        Type.Prop({ name: 'params', type: Type.Referance('QueryParams') }),
        Type.Prop({ name: 'result', type: Type.Referance('QueryResult') }),
      ],
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

export const sqlTs = (loadedQuery: LoadedQuery): string => {
  return printDocument(toQuery({}, loadedQuery));
};
