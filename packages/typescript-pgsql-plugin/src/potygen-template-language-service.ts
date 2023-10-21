import {
  LoadedData,
  loadAllData,
  completionAtOffset,
  InfoContext,
  toInfoContext,
  quickInfoAtOffset,
  inspectError,
  Logger,
} from '@potygen/potygen';
import { Client } from 'pg';
import { TemplateContext, TemplateLanguageService } from 'typescript-template-language-service-decorator';
import * as tss from 'typescript/lib/tsserverlibrary';
import { correctEmptyIdentifierAfterDot } from './helpers';

export const loadData = async (logger: Logger, connection?: string): Promise<LoadedData[]> => {
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
  public loaded = false;

  constructor(private readonly ts: typeof tss, readonly connection: string, readonly logger: Logger) {
    this.ctx = toInfoContext([], logger);
    loadData(logger, connection).then((data) => {
      this.ctx.data = data;
      this.loaded = true;
    });
  }

  getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.CompletionInfo {
    if (!this.loaded) {
      return { isGlobalCompletion: false, isMemberCompletion: false, isNewIdentifierLocation: false, entries: [] };
    }

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

  public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
    if (!this.loaded) {
      return undefined;
    }

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

  public getSemanticDiagnostics(context: TemplateContext): tss.Diagnostic[] {
    if (!this.loaded) {
      return [];
    }
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
