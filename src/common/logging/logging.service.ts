import { Injectable, Logger } from '@nestjs/common';
import { AlsService } from '../als/als.service';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger('AppLogger');

  constructor(private readonly als: AlsService) {}

  private prefix(): string {
    const rid = this.als.getRequestId() ?? '-';
    return `[rid:${rid}]`;
  }

  private constructLogMessage(message: string, ...args: any[]): string {
    if (args.length === 0) {
      return this.prefix() + ' ' + message;
    } else {
      let logMessage = this.prefix() + '\n' + message + '\n';
      for (const arg of args) {
        if (arg instanceof Error) {
          // 如果是一个Error对象，打印错误栈。错误栈本身就是一个字符串，不需要转换
          logMessage += ` \n${arg.stack}\n`;
        } else if (typeof arg === 'string') {
          logMessage += ` \n${arg}\n`;
        } else {
          logMessage += ` \n${JSON.stringify(arg, null, 2)}\n`;
        }
      }
      return logMessage;
    }
  }

  log(message: string, ...args: any[]) {
    this.logger.log(this.constructLogMessage(message, ...args));
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(this.constructLogMessage(message, ...args));
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(this.constructLogMessage(message, ...args));
  }

  error(message: string, ...args: any[]) {
    this.logger.error(this.constructLogMessage(message, ...args));
  }

  fatal(message: string, ...args: any[]) {
    this.logger.fatal(this.constructLogMessage(message, ...args));
  }
}
