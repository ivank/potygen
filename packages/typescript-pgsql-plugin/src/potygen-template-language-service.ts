import { ConfigType, LoadedData, loadAllData } from '@potygen/cli';
import { Client } from 'pg';
import { TemplateContext, TemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as tss from 'typescript/lib/tsserverlibrary';
import { LanguageServiceLogger } from './logger';
import { toLoadedSourceAtOffset } from './traverse';

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

export const loadData = async (logger: LanguageServiceLogger, connection?: string): Promise<LoadedData[]> => {
  const db = new Client(connection);
  try {
    await db.connect();
    return await loadAllData({ db, logger }, []);
  } finally {
    await db.end();
  }
};

export class PotygenTemplateLanguageService implements TemplateLanguageService {
  public data: LoadedData[] = [];

  constructor(private readonly ts: typeof tss, readonly config: ConfigType, readonly logger: LanguageServiceLogger) {
    loadData(logger, config.connection).then((data) => (this.data = data));
  }

  getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.CompletionInfo {
    const sql = removeDotCompletion(context.text, position);
    const offset = context.toOffset(position);
    const source = toLoadedSourceAtOffset(sql, this.data, offset);
    const entries = source?.items
      ? Object.keys(source.items).map((name) => ({
          name,
          sortText: name,
          kind: this.ts.ScriptElementKind.memberVariableElement,
        }))
      : [];
    this.logger.debug(
      `Completion at offset: ${offset} for "${sql}". Found source (${source?.type}) with entries ${entries.length}`,
    );

    return { isGlobalCompletion: false, isMemberCompletion: false, isNewIdentifierLocation: false, entries };
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
