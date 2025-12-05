import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';
import { AlsService } from '@/common/als/als.service';
import { buildTree } from '@/common/utils/build-tree.util';

type InfoPayload = {
  user: {
    publicId: string;
    name: string;
    account: string;
    email: string;
    avatar: string;
    sex: string;
    status: string;
  };
  roles: string[];
  permissions: string[];
};

export type RouterMeta = {
  title: string;
  icon: string | null;
  noCache: boolean;
  link: string | null;
  perms: string | null;
};

export type RouterItem = {
  name: string;
  path: string;
};

export type SideBarItem = {
  title: string;
  url: string | null;
  hidden: boolean;
  frame: boolean;
};

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(SysUser)
    private readonly userRepository: Repository<SysUser>,
    @InjectRepository(SysMenu)
    private readonly menuRepository: Repository<SysMenu>,
    private readonly als: AlsService,
  ) {}

  async getInfo(): Promise<InfoPayload> {
    const userPublicId = this.als.getUserPublicId()!;

    let user: SysUser | null = null;
    try {
      user = await this.userRepository.findOne({
        where: { publicId: userPublicId },
        relations: { roles: true },
        select: {
          id: true,
          publicId: true,
          name: true,
          account: true,
          email: true,
          avatar: true,
          sex: true,
          status: true,
          roles: {
            id: true,
            roleKey: true,
          },
        },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!user) {
      throw new UnauthorizedException({ msg: '用户不存在或已删除', code: 401 });
    }

    const roleKeys = user.roles.map((role) => role.roleKey);
    const isAdmin = roleKeys.includes('admin');

    let permissions: string[] = [];
    if (isAdmin) {
      permissions = ['*:*:*'];
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((role) => role.id);
      let menus: SysMenu[] = [];
      try {
        menus = await this.menuRepository
          .createQueryBuilder('menu')
          .innerJoin('menu.roles', 'role', 'role.id IN (:...roleIds)', {
            roleIds,
          })
          .where('menu.status = :status', { status: '1' })
          .andWhere('menu.deletedAt IS NULL')
          .select(['menu.perms'])
          .getMany();
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }

      // Drop empty permission strings to avoid polluting the permission list
      permissions = Array.from(
        new Set(
          menus
            .map((menu) => menu.perms)
            .filter((perms): perms is string => !!perms?.trim()),
        ),
      );
    }

    return {
      user: {
        publicId: user.publicId,
        name: user.name,
        account: user.account,
        email: user.email,
        avatar: user.avatar,
        sex: user.sex,
        status: user.status,
      },
      roles: roleKeys,
      permissions,
    };
  }

  async getRouters(): Promise<RouterItem[]> {
    const userPublicId = this.als.getUserPublicId()!;

    let user: SysUser | null = null;
    try {
      user = await this.userRepository.findOne({
        where: { publicId: userPublicId },
        relations: { roles: true },
        select: {
          id: true,
          publicId: true,
          roles: { id: true, roleKey: true },
        },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!user) {
      throw new UnauthorizedException({ msg: '用户不存在或已删除', code: 401 });
    }

    const roleKeys = user.roles.map((role) => role.roleKey);
    const isAdmin = roleKeys.includes('admin');

    let menus: SysMenu[] = [];
    if (isAdmin) {
      menus = await this.menuRepository.find({
        where: { status: '1' },
        order: { parentId: 'ASC', sortOrder: 'ASC' },
      });
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((role) => role.id);
      menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoin('menu.roles', 'role', 'role.id IN (:...roleIds)', {
          roleIds,
        })
        .where('menu.status = :status', { status: '1' })
        .andWhere('menu.deletedAt IS NULL')
        .orderBy('menu.parentId', 'ASC')
        .addOrderBy('menu.sortOrder', 'ASC')
        .getMany();
      menus = this.dedupMenus(menus);
    }

    // 这里是路由接口，只有菜单menu才对应有组件路由，并且不能是外链
    const menuNodes = menus
      .filter((menu) => menu.menuType === 'C' && menu.isFrame === '0')
      .map((menu) => this.toRouterItem(menu));
    return menuNodes;
  }

  async getSideBarMenus() {
    const userPublicId = this.als.getUserPublicId()!;

    let user: SysUser | null = null;
    try {
      user = await this.userRepository.findOne({
        where: { publicId: userPublicId },
        relations: { roles: true },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!user) {
      throw new UnauthorizedException({ msg: '用户不存在或已删除', code: 401 });
    }

    const roleKeys = user.roles.map((role) => role.roleKey);
    const isAdmin = roleKeys.includes('admin');

    let menus: SysMenu[] = [];
    if (isAdmin) {
      menus = await this.menuRepository.find({
        // 示例1: menuType 等于 'M' 或 'C' 中的一个
        where: { status: '1', menuType: In(['M', 'C']) },
        order: { parentId: 'ASC', sortOrder: 'ASC' },
      });
    } else if (user.roles.length > 0) {
      const roleIds = user.roles.map((role) => role.id);
      menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoin('menu.roles', 'role', 'role.id IN (:...roleIds)', {
          roleIds,
        })
        .where('menu.status = :status', { status: '1' })
        .andWhere('menu.deletedAt IS NULL')
        .orderBy('menu.parentId', 'ASC')
        .addOrderBy('menu.sortOrder', 'ASC')
        .getMany();
      menus = this.dedupMenus(menus);
    }

    menus = menus.filter((menu) => menu.visible === '1');
    return buildTree<SysMenu, SideBarItem>(menus, this.toSideBarItem);
  }

  // 根据对象某个字段进行去重，需要使用map。set无法对对象进行去重
  private dedupMenus(menus: SysMenu[]): SysMenu[] {
    const deduped = new Map<number, SysMenu>();
    menus.forEach((menu) => deduped.set(menu.id, menu));
    return Array.from(deduped.values());
  }

  private toRouterItem(menu: SysMenu) {
    return {
      name: menu.name,
      path: menu.path!,
    };
  }

  private toSideBarItem(menu: SysMenu) {
    return {
      title: menu.name,
      url: menu.path,
      hidden: menu.visible === '0',
      frame: menu.isFrame === '1',
    };
  }
}
