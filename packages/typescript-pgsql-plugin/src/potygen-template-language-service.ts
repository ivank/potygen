import {
  ConfigType,
  LoadedData,
  loadAllData,
  completionAtOffset,
  InfoContext,
  toInfoContext,
  quickInfoAtOffset,
} from '@potygen/cli';
import { inspectError } from '@potygen/cli/dist/inspect';
import { Client } from 'pg';
import { TemplateContext, TemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as tss from 'typescript/lib/tsserverlibrary';
import { correctEmptyIdentifierAfterDot } from './helpers';
import { LanguageServiceLogger } from './logger';

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
  public ctx: InfoContext;

  constructor(private readonly ts: typeof tss, readonly config: ConfigType, readonly logger: LanguageServiceLogger) {
    this.ctx = toInfoContext([], logger);
    loadData(logger, config.connection).then((data) => (this.ctx.data = data));
  }

  getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.CompletionInfo {
    const offset = context.toOffset(position);
    this.ctx.logger.debug(`CompletionsAtPosition in ${context.text}:${offset}`);
    const sql = correctEmptyIdentifierAfterDot(context.text, offset);
    const completions = completionAtOffset(this.ctx, sql, offset);
    return {
      isGlobalCompletion: false,
      isMemberCompletion: false,
      isNewIdentifierLocation: false,
      entries:
        completions?.map((item) => ({
          name: item.name,
          sortText: item.name,
          kind: this.ts.ScriptElementKind.memberVariableElement,
          sourceDisplay: item.source ? [{ kind: '', text: item.source }] : undefined,
        })) ?? [],
    };
  }

  public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): ts.QuickInfo | undefined {
    const offset = context.toOffset(position);
    this.ctx.logger.debug(`QuickInfoAtPosition in ${context.text}:${offset}`);
    const info = quickInfoAtOffset(this.ctx, context.text, context.toOffset(position));
    return info
      ? {
          kind: this.ts.ScriptElementKind.typeParameterElement,
          kindModifiers: '',
          displayParts: [{ kind: '', text: info.display }],
          documentation: [{ kind: '', text: info.description }],
          textSpan: { start: info.start, length: info.end - info.start + 1 },
        }
      : undefined;
  }

  public getSemanticDiagnostics(context: TemplateContext): ts.Diagnostic[] {
    this.ctx.logger.debug(`SemanticDiagnostics in ${context.text}`);
    const error = inspectError(this.ctx, context.text);
    if (error) {
      this.ctx.logger.debug(`Error (${error.code}): ${error.message} at ${error.start}...${error.end}`);
    }
    return error
      ? [
          {
            file: context.node.getSourceFile(),
            source: 'potygen',
            messageText: error.message,
            category: this.ts.DiagnosticCategory.Error,
            start: error.start,
            code: error.code,
            length: error.end - error.start,
          },
        ]
      : [];
  }
}
