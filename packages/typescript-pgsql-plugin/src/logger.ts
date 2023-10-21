import { Logger } from 'typescript-template-language-service-decorator';
import { Logger as PotygenLogger } from '@potygen/potygen';
import { server } from 'typescript/lib/tsserverlibrary';

export class LanguageServiceLogger implements Logger, PotygenLogger {
  constructor(private readonly projectInfo: server.PluginCreateInfo) {}

  public log(msg: string) {
    this.info(msg);
  }

  public info(msg: string) {
    this.projectInfo.project.projectService.logger.msg(`[potygen] ${msg}`, server.Msg.Info);
  }

  public error(msg: string) {
    this.projectInfo.project.projectService.logger.msg(`[potygen] ${msg}`, server.Msg.Err);
  }

  public debug(msg: string) {
    this.projectInfo.project.projectService.logger.msg(`[potygen] ${msg}`, server.Msg.Perf);
  }
}
