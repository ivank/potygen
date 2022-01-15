import * as tss from 'typescript/lib/tsserverlibrary';
import { decorateWithTemplateLanguageService } from 'typescript-template-language-service-decorator';
import { PotygenTemplateLanguageService } from './potygen-template-language-service';
import { LanguageServiceLogger } from './logger';
import { toConfig } from '@potygen/cli';

export = ({ typescript }: { typescript: typeof tss }) => ({
  create: (info: ts.server.PluginCreateInfo): ts.LanguageService => {
    const service = new PotygenTemplateLanguageService(
      typescript,
      toConfig(info.config),
      new LanguageServiceLogger(info),
    );

    return decorateWithTemplateLanguageService(typescript, info.languageService, info.project, service, {
      tags: ['sql'],
    });
  },
});
