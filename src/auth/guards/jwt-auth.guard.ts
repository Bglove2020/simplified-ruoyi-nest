import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AlsService } from '@/common/als/als.service';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';

type JwtPayload = { sub?: string; userAccount?: string; roleKeys?: string[] };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('ACCESS_JWT') private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly als: AlsService,
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    @InjectRepository(SysMenu)
    private readonly menuRepository: Repository<SysMenu>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const isPublic = this.reflector.get('isPublic', handler);
    const token = this.extractTokenFromHeader(req);

    if (isPublic) {
      if (token) {
        await this.attachUser(token, req, false);
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('缺少访问令牌');
    }

    await this.attachUser(token, req, true);
    return true;
  }

  private async attachUser(token: string, req: Request, strict: boolean) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.loadUserWithAcl(payload);
      (req as any).user = {
        ...payload,
        userId: user.id,
        userPublicId: user.publicId,
        roleKeys: user.roleKeys,
        permissions: user.permissions,
        isAdmin: user.roleKeys.includes('admin'),
      };
      if (payload.sub) {
        this.als.updateContext({ userPublicId: payload.sub });
      }
    } catch (error) {
      if (strict) {
        throw error instanceof UnauthorizedException
          ? error
          : new UnauthorizedException('访问令牌无效');
      }
    }
  }

  private async loadUserWithAcl(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('访问令牌缺少用户信息');
    }

    const user = await this.userRepository.findOne({
      where: { publicId: payload.sub },
      relations: { roles: true },
      select: {
        id: true,
        publicId: true,
        roles: { id: true, roleKey: true },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    const roleKeys = Array.from(
      new Set(user.roles.map((role) => role.roleKey)),
    );
    const isAdmin = roleKeys.includes('admin');
    let permissions: string[] = [];

    if (isAdmin) {
      permissions = ['*:*:*'];
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((role) => role.id);
      const menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoin('menu.roles', 'role', 'role.id IN (:...roleIds)', {
          roleIds,
        })
        .where('menu.status = :status', { status: '1' })
        .andWhere('menu.deletedAt IS NULL')
        .select(['menu.perms'])
        .getMany();

      permissions = Array.from(
        new Set(
          menus
            .map((menu) => menu.perms)
            .filter((perms): perms is string => !!perms?.trim()),
        ),
      );
    }

    return { ...user, roleKeys, permissions };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
