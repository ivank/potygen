import { NoSubstitutionTemplateLiteral } from 'typescript';

export class ParseError extends Error {
  constructor(public tag: NoSubstitutionTemplateLiteral, message: string) {
    super(message);
  }
}
