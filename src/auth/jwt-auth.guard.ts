import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AlsService } from '@/common/als/als.service';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('ACCESS_JWT') private readonly jwt: JwtService, 
    private readonly reflector: Reflector,
    private readonly als: AlsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const req = context.switchToHttp().getRequest<Request>();

    // 获取控制器和路由处理函数上的元数据，并逐级覆盖
    // const controller = context.getClass();
    const handler = context.getHandler();
    const isPublic = this.reflector.get('isPublic', handler);

    const token = this.extractTokenFromHeader(req);

    if (isPublic) {
      // 即使是 Public 接口，如果带了 Token，也尝试解析用户信息放入上下文
      if (token) {
        try {
          const payload = await this.jwt.verifyAsync(token);
          if (payload.sub) {
            this.als.updateContext({ userPublicId: payload.sub });
          }
        } catch {
          // Public 接口忽略 Token 验证错误
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('缺少访问令牌');
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      (req as any).user = payload;
      if (payload.sub) {
        this.als.updateContext({ userPublicId: payload.sub });
      }
      return true;
    } catch {
      throw new UnauthorizedException('访问令牌无效');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}