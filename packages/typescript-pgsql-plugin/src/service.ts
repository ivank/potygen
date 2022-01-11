import { TemplateContext } from 'typescript-template-language-service-decorator';
import { parser, AstTag } from '@potygen/ast';
import { LoadContext, LoadedData } from '@potygen/cli';
import { toSources, Source } from '@potygen/query';
import { Path, toPath } from './traverse';

interface Document {
  ast: AstTag;
  sources: Source[];
}

export const toDocument = (text: string): Document => {
  const { ast } = parser(text);
  return { ast, sources: toSources(ast) };
};

export class Service {
  constructor(public ctx: LoadContext, public data: LoadedData[] = []) {}

  doc(template: TemplateContext): Document {
    const { ast } = parser(template.text);
    return { ast, sources: toSources(ast) };
  }

  positionPath(template: TemplateContext, position: ts.LineAndCharacter): Path {
    return toPath(this.doc(template).ast, template.toOffset(position));
  }
}
