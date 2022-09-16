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
  Node,
  UnionTypeNode,
  PropertySignature,
  TypeLiteralNode,
  addSyntheticLeadingComment,
} from 'typescript';
import {
  LoadedFile,
  LoadedQueryInterface,
  isTypeArray,
  isTypeUnion,
  Type,
  isTypeObjectLiteral,
  isTypeLiteral,
  isTypeEqual,
  isTypeComposite,
  isUniqueBy,
  isTypeOptional,
  TypeName,
  isEmpty,
} from '@potygen/potygen';

const mkdirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);

const isIdentifierRegExp = /^[$A-Z_][0-9A-Z_$]*$/i;

const parseTemplate = (root: string, template: string, path: string): string =>
  Object.entries({ ...parse(relative(root, path)), root }).reduce(
    (acc, [name, value]) => acc.replace(`{{${name}}}`, value),
    template,
  );

type Refs = string[];

interface TypeContext {
  name: string;
  refs: Refs;
  toJson: boolean;
}

const jsDoc = (doc: string): string =>
  `*\n${doc
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n')}\n `;

const withJSDoc = <T extends Node>(doc: string | undefined, node: T): T =>
  doc === undefined ? node : addSyntheticLeadingComment(node, SyntaxKind.MultiLineCommentTrivia, jsDoc(doc), true);

export const compactTypes = (types: Type[]): Type[] =>
  types
    .map((type) => (isTypeOptional(type) ? { ...type.value, nullable: type.nullable } : type))
    .filter((item, index, all) =>
      isTypeLiteral(item) && item.literal !== undefined
        ? !all.some(
            (other, otherIndex) => index !== otherIndex && other.type === item.type && other.literal === undefined,
          )
        : true,
    )
    .filter(isUniqueBy(isTypeEqual));

const toPropertyType =
  (context: TypeContext) =>
  (type: Type): TypeContext & { type: TypeNode } => {
    if (isTypeComposite(type)) {
      return { ...context, type: factory.createToken(SyntaxKind.StringKeyword) };
    } else if (isTypeObjectLiteral(type)) {
      return type.items.reduce<TypeContext & { type: TypeLiteralNode }>(
        (acc, item) => {
          const itemType = toPropertyType({ ...acc, name: context.name + toClassCase(item.name) })(item.type);
          const memeber = factory.createPropertySignature(
            undefined,
            item.name.includes(' ')
              ? factory.createComputedPropertyName(factory.createStringLiteral(item.name))
              : item.name,
            'nullable' in item.type && item.type.nullable ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
            itemType.type,
          );
          return { ...itemType, type: factory.createTypeLiteralNode(acc.type.members.concat(memeber)) };
        },
        { ...context, type: factory.createTypeLiteralNode([]) },
      );
    } else if (isTypeArray(type)) {
      const itemsType = toPropertyType(context)(type.items);
      return { ...itemsType, type: factory.createArrayTypeNode(itemsType.type) };
    } else if (isTypeUnion(type)) {
      const unionTypes = compactTypes(type.items);
      return isEmpty(unionTypes)
        ? { ...context, type: factory.createToken(SyntaxKind.UnknownKeyword) }
        : unionTypes.reduce<TypeContext & { type: UnionTypeNode }>(
            (acc, item, index) => {
              const itemType = toPropertyType({ ...acc, name: context.name + index })(item);
              return { ...itemType, type: factory.createUnionTypeNode(acc.type.types.concat(itemType.type)) };
            },
            { ...context, type: factory.createUnionTypeNode([]) },
          );
    } else if (isTypeOptional(type)) {
      return type.value
        ? toPropertyType(context)(type.value)
        : { ...context, type: factory.createToken(SyntaxKind.UnknownKeyword) };
    } else {
      switch (type.type) {
        case TypeName.Date:
          return { ...context, type: factory.createTypeReferenceNode('Date') };
        case TypeName.Buffer:
          return { ...context, type: factory.createTypeReferenceNode('Buffer') };
        case TypeName.Boolean:
          return {
            ...context,
            type:
              type.literal !== undefined
                ? factory.createLiteralTypeNode(type.literal ? factory.createTrue() : factory.createFalse())
                : factory.createToken(SyntaxKind.BooleanKeyword),
          };
        case TypeName.Json:
          return {
            ...context,
            refs: context.refs.concat(context.name),
            type: context.toJson
              ? factory.createTypeReferenceNode('Json', [factory.createTypeReferenceNode(context.name)])
              : factory.createTypeReferenceNode(context.name),
          };
        case TypeName.Null:
          return { ...context, type: factory.createLiteralTypeNode(factory.createToken(SyntaxKind.NullKeyword)) };
        case TypeName.Number:
        case TypeName.BigInt:
          return {
            ...context,
            type:
              type.literal !== undefined
                ? factory.createLiteralTypeNode(factory.createStringLiteral(String(type.literal)))
                : factory.createToken(SyntaxKind.NumberKeyword),
          };
        case TypeName.String:
          return {
            ...context,
            type:
              type.literal !== undefined
                ? factory.createLiteralTypeNode(factory.createStringLiteral(type.literal))
                : factory.createToken(SyntaxKind.StringKeyword),
          };
        case TypeName.Unknown:
          return { ...context, type: factory.createToken(SyntaxKind.UnknownKeyword) };
        case TypeName.Any:
          return { ...context, type: factory.createToken(SyntaxKind.AnyKeyword) };
      }
    }
  };

const toClassCase = (identifier: string) => identifier[0].toUpperCase() + identifier.slice(1);

const toAstImports = (names: string[]): Statement =>
  factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports(
        names.map((name) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name))),
      ),
    ),
    factory.createStringLiteral('@potygen/potygen'),
  );

const toLoadedQueryTypeNodes = (
  refs: Refs,
  name: string,
  loadedQuery: LoadedQueryInterface,
): { resultRefs: Refs; statements: Statement[] } => {
  const params = loadedQuery.params.reduce<{ refs: Refs; props: PropertySignature[] }>(
    (acc, item) => {
      const itemType = toPropertyType({ toJson: false, name: 'TParam' + toClassCase(item.name), refs: acc.refs })(
        item.type,
      );
      const prop = factory.createPropertySignature(
        undefined,
        item.name,
        'nullable' in item.type && item.type.nullable ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
        itemType.type,
      );
      return { ...itemType, props: acc.props.concat(prop) };
    },
    { refs, props: [] },
  );

  const results = loadedQuery.results.reduce<{ refs: Refs; props: PropertySignature[] }>(
    (acc, item) => {
      const itemType = toPropertyType({ toJson: true, name: 'T' + toClassCase(item.name), refs: acc.refs })(item.type);
      const prop = withJSDoc(
        item.type.comment ?? undefined,
        factory.createPropertySignature(
          undefined,
          isIdentifierRegExp.test(item.name) ? item.name : factory.createStringLiteral(item.name),
          'nullable' in item.type && item.type.nullable ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
          itemType.type,
        ),
      );
      return { ...itemType, props: acc.props.concat(prop) };
    },
    { refs: [], props: [] },
  );

  return {
    resultRefs: results.refs,
    statements: [
      factory.createInterfaceDeclaration(
        undefined,
        [factory.createModifier(SyntaxKind.ExportKeyword)],
        `${name}Params`,
        params.refs.map((ref) =>
          factory.createTypeParameterDeclaration(ref, undefined, factory.createToken(SyntaxKind.UnknownKeyword)),
        ),
        undefined,
        params.props,
      ),
      factory.createInterfaceDeclaration(
        undefined,
        [factory.createModifier(SyntaxKind.ExportKeyword)],
        `${name}Result`,
        results.refs.map((ref) =>
          factory.createTypeParameterDeclaration(ref, undefined, factory.createToken(SyntaxKind.UnknownKeyword)),
        ),
        undefined,
        results.props,
      ),
      factory.createInterfaceDeclaration(
        undefined,
        [factory.createModifier(SyntaxKind.ExportKeyword)],
        `${name}Query`,
        [...params.refs, ...results.refs].map((ref) =>
          factory.createTypeParameterDeclaration(ref, undefined, factory.createToken(SyntaxKind.UnknownKeyword)),
        ),
        undefined,
        [
          factory.createPropertySignature(
            undefined,
            'params',
            undefined,
            factory.createTypeReferenceNode(
              `${name}Params`,
              params.refs.map((ref) => factory.createTypeReferenceNode(ref)),
            ),
          ),
          factory.createPropertySignature(
            undefined,
            'result',
            undefined,
            factory.createTypeReferenceNode(
              `${name}Result`,
              results.refs.map((ref) => factory.createTypeReferenceNode(ref)),
            ),
          ),
        ],
      ),
    ],
  };
};

export const toTypeSource = (file: LoadedFile, typePrefix: string = ''): SourceFile => {
  const content =
    file.type === 'ts'
      ? file.queries.reduce<{ resultRefs: Refs; statements: Statement[] }>(
          (acc, query) => {
            const { statements, resultRefs } = toLoadedQueryTypeNodes(
              acc.resultRefs,
              typePrefix + toClassCase(query.name),
              query.loadedQuery,
            );
            return { resultRefs, statements: acc.statements.concat(statements) };
          },
          { resultRefs: [], statements: [] },
        )
      : toLoadedQueryTypeNodes([], typePrefix, file.loadedQuery);

  return factory.updateSourceFile(
    createSourceFile(file.path, '', ScriptTarget.ES2021, true),
    content.resultRefs.length > 0 ? [toAstImports(['Json']), ...content.statements] : content.statements,
  );
};

export const emitLoadedFile = (root: string, template: string, typePrefix?: string) => {
  const printer = createPrinter({ newLine: NewLineKind.LineFeed });
  return async (file: LoadedFile): Promise<void> => {
    const outputFile = parseTemplate(root, template, file.path);
    const directory = dirname(outputFile);

    await mkdirAsync(directory, { recursive: true });
    await writeFileAsync(outputFile, printer.printFile(toTypeSource(file, typePrefix)));
  };
};
