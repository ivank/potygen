import { mkdir, writeFile } from 'fs';
import { promisify } from 'util';
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
import { LoadedFile, LoadedQueryInterface } from './types';
import { isTypeArrayConstant, isTypeUnionConstant, TypeConstant, isTypeObjectLiteralConstant } from '@psql-ts/query';

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

const parseTemplate = (root: string, template: string, path: string): string =>
  Object.entries({ ...parse(relative(root, path)), root }).reduce(
    (acc, [name, value]) => acc.replace(`{{${name}}}`, value),
    template,
  );

const toPropertyType = (type: TypeConstant): TypeNode => {
  if (isTypeObjectLiteralConstant(type)) {
    return factory.createTypeLiteralNode(
      type.items.map((item) =>
        factory.createPropertySignature(undefined, item.name, undefined, toPropertyType(item.type)),
      ),
    );
  } else if (isTypeArrayConstant(type)) {
    return factory.createArrayTypeNode(toPropertyType(type.items));
  } else if (isTypeUnionConstant(type)) {
    return factory.createUnionTypeNode(type.items.map(toPropertyType));
  } else {
    switch (type.type) {
      case 'Date':
      case 'Buffer':
        return factory.createTypeReferenceNode(type.type);
      case 'Boolean':
        return type.literal !== undefined
          ? factory.createLiteralTypeNode(factory.createStringLiteral(type.literal ? 'true' : 'false'))
          : factory.createToken(SyntaxKind.BooleanKeyword);
      case 'Json':
        return factory.createToken(SyntaxKind.UnknownKeyword);
      case 'Null':
        return factory.createLiteralTypeNode(factory.createToken(SyntaxKind.NullKeyword));
      case 'Number':
        return type.literal !== undefined
          ? factory.createLiteralTypeNode(factory.createStringLiteral(String(type.literal)))
          : factory.createToken(SyntaxKind.NumberKeyword);
      case 'String':
        return type.literal !== undefined
          ? factory.createLiteralTypeNode(factory.createStringLiteral(type.literal))
          : factory.createToken(SyntaxKind.StringKeyword);
      case 'Unknown':
        return factory.createToken(SyntaxKind.UnknownKeyword);
      case 'Any':
        return factory.createToken(SyntaxKind.AnyKeyword);
    }
  }
};

const toClassCase = (identifier: string) => identifier[0].toUpperCase() + identifier.slice(1);

const toLoadedQueryTypeNodes = (name: string, loadedQuery: LoadedQueryInterface): Statement[] => [
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
        'nullable' in item.type && item.type.nullable ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
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
    loadedQuery.results.map((item) =>
      factory.createPropertySignature(
        undefined,
        item.name,
        'nullable' in item.type && item.type.nullable ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
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
  return async (file: LoadedFile): Promise<void> => {
    const outputFile = parseTemplate(root, template, file.path);
    const directory = dirname(outputFile);

    await mkdirAsync(directory, { recursive: true });
    await writeFileAsync(outputFile, printer.printFile(toTypeSource(file)));
  };
};
