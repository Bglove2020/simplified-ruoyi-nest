import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject('ACCESS_JWT') private readonly jwt: JwtService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('JwtAuthGuard canActivate');
    const req = context.switchToHttp().getRequest<Request>();
    console.log('req.cookies: ', req.cookies);
    // 获取控制器和路由处理函数上的元数据，并逐级覆盖
    // const controller = context.getClass();
    const handler = context.getHandler();
    const isPublic = this.reflector.get('isPublic', handler);
    console.log('isPublic:', isPublic);
    if (isPublic) {
      return true;
    }
    // const auth = req.headers.authorization || '';
    // const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    // const cookieHeader = req.headers.cookie || '';
    // const cookieTokenMatch = cookieHeader.includes('access_token=') ? decodeURIComponent(cookieHeader.split('access_token=')[1].split(';')[0]) : undefined;
    // const token = headerToken || cookieTokenMatch;
    if (!req.headers.authorization) {
      throw new UnauthorizedException('缺少访问令牌');
    }
    try {
      const payload = await this.jwt.verifyAsync(req.headers.authorization.split('Bearer ')[1]);
      console.log('payload:', payload);
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('访问令牌无效');
    }
  }
}