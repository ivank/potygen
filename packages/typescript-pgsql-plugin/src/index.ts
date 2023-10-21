import * as tss from 'typescript/lib/tsserverlibrary';
import { decorateWithTemplateLanguageService } from 'typescript-template-language-service-decorator';
import { PotygenTemplateLanguageService } from './potygen-template-language-service';
import { LanguageServiceLogger } from './logger';

export = ({ typescript }: { typescript: typeof tss }) => ({
  create: (info: tss.server.PluginCreateInfo): tss.LanguageService => {
    const service = new PotygenTemplateLanguageService(
      typescript,
      info.config.connection,
      new LanguageServiceLogger(info),
    );

    return decorateWithTemplateLanguageService(typescript, info.languageService, info.project, service, {
      tags: ['sql'],
    });
  },
});
