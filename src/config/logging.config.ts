import { registerAs } from '@nestjs/config';
import * as path from 'path';

export default registerAs('logging', () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

  return {
    // 日志目录
    logDir,
    // 是否开发环境
    isDevelopment,
    // 日志级别
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    // 是否输出到控制台
    console: isDevelopment,
    // 是否输出到文件
    file: true,
    // 日志文件前缀
    filePrefix: 'app',
    // 日志文件扩展名
    fileExtension: '.log',
  };
});

