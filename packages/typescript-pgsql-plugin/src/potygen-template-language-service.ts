import { ConfigType } from '@potygen/cli';
import { TemplateContext, TemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as tss from 'typescript/lib/tsserverlibrary';
import { LanguageServiceLogger } from './logger';

export const removeDotCompletion = (sql: string, position: tss.LineAndCharacter): string =>
  sql
    .split('\n')
    .map((text, line) =>
      position.line === line
        ? text.slice(0, position.character - 1) +
          text.slice(position.character - 1).replace(/^\.(\.|[A-Z_][A-Z0-9_]*|"((?:""|[^"])*)")?/i, '.id')
        : text,
    )
    .join('\n');

export class PotygenTemplateLanguageService implements TemplateLanguageService {
  constructor(
    private readonly ts: typeof tss,
    private readonly config: ConfigType,
    private readonly logger: LanguageServiceLogger,
  ) {}

  // public getCompletionsAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.WithMetadata<ts.CompletionInfo> {}

  getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): ts.CompletionInfo {
    this.logger.log(
      `${this.config.connection}, "${context.text}", "${context.rawText}", offset: ${context.toOffset(position)}`,
    );
    this.logger.log(JSON.stringify(position, null, 2));

    const line = context.text.split(/\n/g)[position.line];
    return {
      isGlobalCompletion: false,
      isMemberCompletion: false,
      isNewIdentifierLocation: false,
      entries: [
        {
          name: line.slice(0, position.character),
          kind: this.ts.ScriptElementKind.directory,
          kindModifiers: 'echo',
          sortText: 'echo',
        },
      ],
    };
  }

  // public getCompletionEntryDetails(context: TemplateContext, position: ts.LineAndCharacter, name: string ): ts.CompletionEntryDetails {}

  public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): ts.QuickInfo | undefined {
    return {
      kind: this.ts.ScriptElementKind.directory,
      kindModifiers: '',
      textSpan: {
        start: position.character,
        length: 1,
      },
      displayParts: [],
      documentation: [{ kind: 'unknown', text: 'TEST' }],
    };
  }

  // public getSemanticDiagnostics(context: TemplateContext): ts.Diagnostic[] {}

  // public getSupportedCodeFixes(): number[] {}

  // public getCodeFixesAtPosition(context: TemplateContext, start: number, end: number, errorCodes: number[], format: ts.FormatCodeSettings) {}

  // public getOutliningSpans(context: TemplateContext): ts.OutliningSpan[] {}
}
