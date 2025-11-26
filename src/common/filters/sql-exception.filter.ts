import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class SqlExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const anyErr: any = exception;
    const code = anyErr?.code || anyErr?.driverError?.code;
    const msg = String(anyErr?.sqlMessage || anyErr?.message || '');

    let status = HttpStatus.BAD_REQUEST;
    let message = '数据库错误';

    if (code === 'ER_DUP_ENTRY') {
      const body = request?.body || {};
      if (body?.account && msg.includes(body.account)) {
        message = '账号已存在';
      } else if (body?.email && msg.includes(body.email)) {
        message = '邮箱已存在';
      } else {
        message = '唯一键冲突';
      }
    } else if (code === 'ER_NO_REFERENCED_ROW_2' || msg.includes('a foreign key constraint fails')) {
      message = '关联对象不存在';
    } else if (code === 'ER_DATA_TOO_LONG') {
      message = '字段长度超出限制';
    } else if (code === 'ER_BAD_NULL_ERROR') {
      message = '必填字段为空';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器错误';
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}