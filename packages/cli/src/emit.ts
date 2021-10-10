import { mkdirSync, writeFileSync } from 'fs';
import { dirname, parse, relative } from 'path';
import {
  factory,
  createSourceFile,
  ScriptTarget,
  SourceFile,
  TypeNode,
  SyntaxKind,
  createPrinter,
  NewLineKind,
  Statement,
} from 'typescript';
import { LoadedQuery } from '.';
import { isLoadedArrayType, isLoadedLiteralType, isLoadedUnionType, isLoadedValuesPick } from './guards';
import { LoadedFile, LoadedType, LoadedValuesPick } from './types';

const parseTemplate = (root: string, template: string, path: string): string =>
  Object.entries({ ...parse(relative(root, path)), root }).reduce(
    (acc, [name, value]) => acc.replace(`{{${name}}}`, value),
    template,
  );

const toPropertyType = (type: LoadedType | LoadedValuesPick): TypeNode => {
  if (isLoadedValuesPick(type)) {
    return factory.createArrayTypeNode(
      factory.createTypeLiteralNode(
        type.items.map((item) =>
          factory.createPropertySignature(undefined, item.name, undefined, toPropertyType(item.value)),
        ),
      ),
    );
  } else if (isLoadedArrayType(type)) {
    return factory.createArrayTypeNode(toPropertyType(type.items));
  } else if (isLoadedUnionType(type)) {
    return factory.createUnionTypeNode(type.items.map(toPropertyType));
  } else if (isLoadedLiteralType(type)) {
    return factory.createLiteralTypeNode(factory.createStringLiteral(type.value));
  } else {
    switch (type.type) {
      case 'Date':
        return factory.createTypeReferenceNode('Date');
      case 'boolean':
        return factory.createToken(SyntaxKind.BooleanKeyword);
      case 'json':
        return factory.createToken(SyntaxKind.UnknownKeyword);
      case 'null':
        return factory.createLiteralTypeNode(factory.createToken(SyntaxKind.NullKeyword));
      case 'number':
        return factory.createToken(SyntaxKind.NumberKeyword);
      case 'string':
        return factory.createToken(SyntaxKind.StringKeyword);
      case 'unknown':
        return factory.createToken(SyntaxKind.UnknownKeyword);
    }
  }
};

const toClassCase = (identifier: string) => identifier[0].toUpperCase() + identifier.slice(1);

const toLoadedQueryTypeNodes = (name: string, loadedQuery: LoadedQuery): Statement[] => [
  factory.createInterfaceDeclaration(
    undefined,
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    `${name}Params`,
    undefined,
    undefined,
    loadedQuery.params.map((item) =>
      factory.createPropertySignature(
        undefined,
        item.name,
        item.type.optional ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
        toPropertyType(item.type),
      ),
    ),
  ),
  factory.createInterfaceDeclaration(
    undefined,
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    `${name}Result`,
    undefined,
    undefined,
    loadedQuery.result.map((item) =>
      factory.createPropertySignature(
        undefined,
        item.name,
        item.type.optional ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
        toPropertyType(item.type),
      ),
    ),
  ),
  factory.createInterfaceDeclaration(
    undefined,
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    `${name}Query`,
    undefined,
    undefined,
    [
      factory.createPropertySignature(undefined, 'params', undefined, factory.createTypeReferenceNode(`${name}Params`)),
      factory.createPropertySignature(undefined, 'result', undefined, factory.createTypeReferenceNode(`${name}Result`)),
    ],
  ),
];

export const toTypeSource = (file: LoadedFile): SourceFile =>
  factory.updateSourceFile(
    createSourceFile(file.path, '', ScriptTarget.ES2021, true),
    file.type === 'ts'
      ? file.queries.flatMap((query) => toLoadedQueryTypeNodes(toClassCase(query.name), query.loadedQuery))
      : toLoadedQueryTypeNodes('', file.loadedQuery),
  );

export const emitLoadedFile = (root: string, template: string) => {
  const printer = createPrinter({ newLine: NewLineKind.LineFeed });
  return (file: LoadedFile): void => {
    const outputFile = parseTemplate(root, template, file.path);
    const directory = dirname(outputFile);

    mkdirSync(directory, { recursive: true });
    writeFileSync(outputFile, printer.printFile(toTypeSource(file)));
  };
};
