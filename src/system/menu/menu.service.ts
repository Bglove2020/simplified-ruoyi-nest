import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import FrontendMenuDto from './dto/frontend-menu.dto';
import { SysMenu } from './entities/menu.entity';
import { buildTree } from '@/common/utils/build-tree.util';
import { toFrontendDto } from './mapper/to-fronted_menu';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(SysMenu)
    private menuRepository: Repository<SysMenu>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const menu = this.menuRepository.create(createMenuDto);
    if (createMenuDto.parentPublicId) {
      let parentMenu: SysMenu | null = null;

      try {
        parentMenu = await this.menuRepository.findOne({
          where: { publicId: createMenuDto.parentPublicId },
        });
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }

      if (!parentMenu) {
        throw new BadRequestException({ msg: '父菜单不存在', code: 400 });
      }
      menu.parentId = parentMenu.id;
      menu.ancestors = `${parentMenu.ancestors},${parentMenu.id}`;
    } else {
      menu.parentId = 0;
      menu.ancestors = '0';
    }

    try {
      await this.menuRepository.save(menu);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库保存错误', code: 400 });
    }
  }

  async list(): Promise<(FrontendMenuDto & { children: (FrontendMenuDto & { children: any[] })[] })[]> {
    let menus: SysMenu[] = [];
    try {
      menus = await this.menuRepository.find();
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    return buildTree<SysMenu, FrontendMenuDto>(menus, toFrontendDto);
  }

  async get(publicId: string) {
    let menu: SysMenu | null = null;
    try {
      menu = await this.menuRepository.findOne({ where: { publicId } });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!menu) {
      throw new BadRequestException({ msg: '菜单不存在', code: 400 });
    }
    return menu;
  }

  async update(updateMenuDto: UpdateMenuDto) {
    let menu: SysMenu | null = null;
    try {
      menu = await this.menuRepository.findOne({ where: { publicId: updateMenuDto.publicId } });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!menu) {
      throw new BadRequestException({ msg: '菜单不存在', code: 400 });
    }

    if (updateMenuDto.parentPublicId) {
      let parentMenu: SysMenu | null = null;
      try {
        parentMenu = await this.menuRepository.findOne({
          where: { publicId: updateMenuDto.parentPublicId },
        });
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }
      if (!parentMenu) {
        throw new BadRequestException({ msg: '父菜单不存在', code: 400 });
      }
      menu.parentId = parentMenu.id;
      menu.ancestors = `${parentMenu.ancestors},${parentMenu.id}`;
    }

    Object.assign(menu, updateMenuDto);

    try {
      await this.menuRepository.save(menu);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库更新错误', code: 400 });
    }
  }

  async delete(publicId: string) {
    let menu: SysMenu | null = null;
    try {
      menu = await this.menuRepository.findOne({ where: { publicId } });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!menu) {
      throw new BadRequestException({ msg: '菜单不存在', code: 400 });
    }
    
    try {
      await this.menuRepository.softRemove(menu);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库删除错误', code: 400 });
    }

    let subMenus: SysMenu[] = [];
    try {
      subMenus = await this.menuRepository
        .createQueryBuilder('menu')
        .where('menu.ancestors LIKE :ancestorId', { ancestorId: `%${menu.id}%` })
        .getMany();
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }

    if (subMenus.length > 0) {
      try {
        await this.menuRepository.softRemove(subMenus);
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库删除错误', code: 400 });
      }
    }
  }
}
