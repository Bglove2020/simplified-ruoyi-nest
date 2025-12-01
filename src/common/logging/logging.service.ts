import { Inject, Injectable, LoggerService } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import pino, { Level, Logger as PinoLogger, LoggerOptions } from 'pino';
import pinoPretty from 'pino-pretty';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Transform } from 'node:stream';
import loggingConfig from '../../config/logging.config';
import { AlsService } from '../als/als.service';
import { RequestContext } from '../als/als.constants';

const LEVEL_LABELS: Record<number, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

/**
 * 格式化日志条目为可读格式
 * 对象属性以缩进和换行的方式展示
 */
function formatLogEntry(log: Record<string, any>): string {
  const { time, level, msg, requestId, userPublicId,query, ...rest } = log;
  const levelLabel = LEVEL_LABELS[level] || 'INFO';

  // 格式化时间戳
  const timestamp = time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '';

  // 构建基础日志行
  let output = `[${timestamp}] ${levelLabel.padEnd(5)}`;
  output += ` ${msg}`;
  if (requestId) {
    output += `\n[requestId:${requestId}]`;
  }
  if (userPublicId) {
    output += ` [userPublicId:${userPublicId}]`;
  }
  if (query) {
    output += `\n[query:\n${query}\n]`;
  }

  // 如果有额外属性，以格式化的 JSON 展示
  if (Object.keys(rest).length > 0) {
    output += '\n' + JSON.stringify(rest, null, 2);
  }
  output += '\n';
  return output;
}

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: PinoLogger;

  constructor(
    private readonly als: AlsService,
    @Inject(loggingConfig.KEY)
    private readonly config: ConfigType<typeof loggingConfig>,
  ) {
    this.ensureLogDir();
    this.logger = this.buildLogger();
  }

  private ensureLogDir() {
    if (!this.config.file) {
      return;
    }
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private buildLogger(): PinoLogger {
    const options: LoggerOptions = {
      level: this.config.level,
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      mixin: () => {
        // 一定会有请求id
        const context: RequestContext = {
          requestId:this.als.getRequestId(),
        };
        // 只有登录了才有用户，携带token请求是才会有用户id
        const userPublicId = this.als.getUserPublicId();
        if (userPublicId) context.userPublicId = userPublicId;  // 自动添加到所有日志

        return context;
      },
    };

    const streams: pino.StreamEntry[] = [];

    if (this.config.console) {
      streams.push({
        level: this.config.level as Level,
        stream: pinoPretty({
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
          ignore: 'pid,hostname',
        }),
      });
    }

    if (this.config.file) {
      const baseFile = path.join(this.config.logDir, this.config.filePrefix);
      // pino.transport返回的是一个WritableStream，这里pino-roll执行的逻辑是接收流并写入文件
      const rollingDestination = pino.transport({
        target: 'pino-roll',
        options: {
          file: baseFile,
          frequency: 'daily',
          size: '10m',
          mkdir: true,
          extension: this.config.fileExtension,
          dateFormat: 'yyyy-MM-dd',
        },
      });

      // 这里的思路是自定义一个格式化流，这个流直接接收pino输出的原始json日志流，然后对日志流进行格式化
      // 格式化后的日志流再流入pino-roll流，最后pino-roll流写入文件
      const formatterStream = this.createFileFormatterStream(rollingDestination);
      streams.push({
        level: this.config.level as Level,
        stream: formatterStream,
      });
    }

    if (streams.length === 0) {
      return pino(options);
    }

    return pino(options, pino.multistream(streams));
  }

  /**
   * 创建文件日志格式化流
   * 将 JSON 日志转换为可读格式，对象以缩进形式展示
   */
  private createFileFormatterStream(destination: NodeJS.WritableStream): Transform {
    const transform = new Transform({
      // 绝大部分的情况下，pino输出的chunk是一个完整的日志字符串，请求多的时候可能包含多个日志字符串
      transform(chunk, _encoding, callback) {
        try {
          const lines = chunk.toString().split('\n').filter(Boolean);
          // 将每个日志字符串转换为可读格式
          const formatted = lines
            .map((line: string) => {
              try {
                // 将日志字符串转换为JSON对象
                const log = JSON.parse(line);
                // 格式化日志对象
                return formatLogEntry(log);
              } catch {
                return line;
              }
            })
            .join('\n');
          callback(null, formatted + '\n');
        } catch {
          callback(null, chunk);
        }
      },
    });
    // 将格式化后的数据 pipe 到目标流
    transform.pipe(destination);
    // 返回 Transform stream，让 pino 写入数据到这里
    return transform;
  }

  log(message: string, ...args: any[]) {
    this.write('info', message, args);
  }

  warn(message: string, ...args: any[]) {
    this.write('warn', message, args);
  }

  debug(message: string, ...args: any[]) {
    this.write('debug', message, args);
  }

  error(message: string, ...args: any[]) {
    this.write('error', message, args);
  }

  fatal(message: string, ...args: any[]) {
    this.write('fatal', message, args);
  }

  private write(level: Level, message: string, args: any[]) {
    const payload = this.normalizePayload(args);
    if (payload) {
      this.logger[level](payload, message);
      return;
    }
    this.logger[level](message);
  }

  private normalizePayload(args: any[]) {
    if (!args?.length) {
      return undefined;
    }
    if (args.length === 1) {
      return this.serializeArg(args[0]);
    }
    return {
      args: args.map((arg) => this.serializeArg(arg)),
    };
  }

  private serializeArg(arg: any) {
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: arg.message,
        stack: arg.stack,
      };
    }
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      return arg;
    }
    return arg;
  }
}
