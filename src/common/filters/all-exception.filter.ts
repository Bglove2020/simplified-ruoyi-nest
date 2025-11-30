import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

// 空参数表示拦截所有的异常
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

    constructor(
        private readonly loggingService: LoggingService
    ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();



    console.log(exception);
    // 打印 exception 对象的所有可用信息
    if (exception instanceof HttpException) {
      // HttpException有响应体和状态码
      const res = exception.getResponse();
      const msg = exception.message;
      const name = exception.name;
      const status = exception.getStatus();
      console.log('HttpException Info:');
      console.log('name:', name);
      console.log('message:', msg);
      console.log('status:', status);
      console.log('getResponse():', res);
      if (typeof res === 'object') {
        console.log('Response keys:', Object.keys(res as any));
      }
    } else if (exception instanceof Error) {
      // 标准Error对象
      console.log('Error Info:');
      console.log('name:', exception.name);
      console.log('message:', exception.message);
      console.log('stack:', exception.stack);
      // 打印所有自有属性
      for (const key of Object.keys(exception)) {
        console.log(`exception property: ${key}`);
        // @ts-ignore
        console.log(`${key}:`, (exception as any)[key]);
      }
    } else if (typeof exception === 'object' && exception !== null) {
      // 其它对象类型
      console.log('Unknown Exception Object, keys:', Object.keys(exception as any));
      for (const key of Object.keys(exception as any)) {
        // @ts-ignore
        console.log(`${key}:`, (exception as any)[key]);
      }
    } else {
      // 字符串、数字等
      console.log('Raw exception:', exception);
    }

    // --- 核心日志记录 ---
    const errorData = {
        errorName: (exception as Error).name,
        errorMessage: (exception as Error).message,
        errorStack: (exception as Error).stack,
    };
    this.loggingService.error(`${request.method} ${request.url}`, errorData);

    // console.log('errorData:', errorData);

    // ... 格式化响应体并发送给客户端
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const responseBody = exception instanceof HttpException ? exception.getResponse() : {
      code: 500,
      msg: '系统异常',
    };
    response.status(status).json(responseBody);
  }
}