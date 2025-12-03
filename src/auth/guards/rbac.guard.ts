import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMS_KEY } from '../decorators/perms.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      handler,
      controller,
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        handler,
        controller,
      ]) ?? [];
    const requiredPerms =
      this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
        handler,
        controller,
      ]) ?? [];

    // 若未声明任何角色或权限要求，直接放行
    if (requiredRoles.length === 0 && requiredPerms.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    if (!user) {
      throw new ForbiddenException('未登录或令牌无效');
    }

    const roleKeys: string[] = Array.isArray(user.roleKeys)
      ? user.roleKeys
      : [];
    const permissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];
    const isAdmin = user.isAdmin || roleKeys.includes('admin');
    const hasWildcardPerm = permissions.includes('*:*:*');

    if (isAdmin) {
      return true;
    }

    // 要求的角色，只需要有一个即可
    const rolesOk =
      requiredRoles.length === 0 ||
      requiredRoles.some((role) => roleKeys.includes(role));
    //要求的权限参数必须都有，不能少
    const permsOk =
      requiredPerms.length === 0 ||
      requiredPerms.every(
        (perm) => hasWildcardPerm || permissions.includes(perm),
      );

    if (!rolesOk || !permsOk) {
      throw new ForbiddenException({ msg: '权限不足', code: 403 });
    }

    return true;
  }
}
