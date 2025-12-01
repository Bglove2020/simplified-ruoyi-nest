import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggingService } from '../logging/logging.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorData = this.buildErrorPayload(exception);
    this.loggingService.error(`${request.method} ${request.url}`, errorData);

    const body = this.buildResponseBody(exception, status, request?.url);
    response.status(status).json(body);
  }

  private buildErrorPayload(exception: unknown) {
    if (exception instanceof HttpException) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
        status: exception.getStatus(),
        response: exception.getResponse(),
      };
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    const normalized =
      typeof exception === 'string'
        ? exception
        : typeof exception === 'object'
          ? JSON.stringify(exception)
          : String(exception);

    return {
      name: 'NonErrorException',
      message: normalized,
    };
  }

  private buildResponseBody(exception: unknown, status: number, path: string) {
    const base = {
      statusCode: status,
      path,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { ...base, message: res };
      }

      if (typeof res === 'object') {
        const body: Record<string, unknown> = { ...base, ...(res as object) };
        if (!body.message) {
          body.message = exception.message;
        }
        return body;
      }
    }

    return { ...base, message: '系统异常' };
  }
}
