import { document, printDocument, DocumentContext, Type, withIdentifier } from '@ovotech/ts-compose';
import { TypeNode } from 'typescript';
import { isLoadedArrayType, isLoadedUnionType, isLoadedLiteralType, isLoadedValuesPick } from './guards';
import { LoadedQuery, LoadedValuesPick, LoadedType } from './types';

const toPropertyType = (type: LoadedType | LoadedValuesPick): TypeNode => {
  if (isLoadedValuesPick(type)) {
    return Type.Array(
      Type.TypeLiteral({
        props: type.items.map((item) => Type.Prop({ name: item.name, type: toPropertyType(item.value) })),
      }),
    );
  } else if (isLoadedArrayType(type)) {
    return Type.Array(toPropertyType(type.items));
  } else if (isLoadedUnionType(type)) {
    return Type.Union(type.items.map(toPropertyType));
  } else if (isLoadedLiteralType(type)) {
    return Type.Literal(type.value);
  } else {
    switch (type.type) {
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

export const toQueryTypescriptTypes = (context: DocumentContext, query: LoadedQuery) => {
  const paramsContext = withIdentifier(
    context,
    Type.Interface({
      name: 'QueryParams',
      isExport: true,
      props: query.params.map(({ name, type }) =>
        Type.Prop({ name, type: toPropertyType(type), isOptional: type.optional }),
      ),
    }),
  );

  const resultContext = withIdentifier(
    paramsContext,
    Type.Interface({
      name: 'QueryResult',
      isExport: true,
      props: query.result.map(({ name, type }) =>
        Type.Prop({ name, type: toPropertyType(type), isOptional: type.optional }),
      ),
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

export const toQueryTypescript = (loadedQuery: LoadedQuery): string => {
  return printDocument(toQueryTypescriptTypes({}, loadedQuery));
};
