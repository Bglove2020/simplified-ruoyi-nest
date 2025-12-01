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
      const parentMenu = await this.menuRepository.findOne({
        where: { publicId: createMenuDto.parentPublicId },
      });
      if (!parentMenu) {
        throw new BadRequestException('Parent menu not found');
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
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('菜单名称已存在');
      }
      throw new BadRequestException('菜单创建失败');
    }
  }

  async list(): Promise<(FrontendMenuDto & { children: (FrontendMenuDto & { children: any[] })[] })[]> {
    const menus = await this.menuRepository.find();
    return buildTree<SysMenu, FrontendMenuDto>(menus, toFrontendDto);
  }

  async get(publicId: string) {
    const menu = await this.menuRepository.findOne({ where: { publicId } });
    if (!menu) {
      throw new BadRequestException('Menu not found');
    }
    return menu;
  }

  async update(updateMenuDto: UpdateMenuDto) {
    const menu = await this.menuRepository.findOne({ where: { publicId: updateMenuDto.publicId } });
    if (!menu) {
      throw new BadRequestException('Menu not found');
    }

    if (updateMenuDto.parentPublicId) {
      const parentMenu = await this.menuRepository.findOne({
        where: { publicId: updateMenuDto.parentPublicId },
      });
      if (!parentMenu) {
        throw new BadRequestException('Parent menu not found');
      }
      menu.parentId = parentMenu.id;
      menu.ancestors = `${parentMenu.ancestors},${parentMenu.id}`;
    }

    Object.assign(menu, updateMenuDto);

    try {
      await this.menuRepository.save(menu);
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Menu name already exists');
      }
      throw new BadRequestException(`Failed to update menu: ${msg}`);
    }
  }

  async delete(publicId: string) {
    const menu = await this.menuRepository.findOne({ where: { publicId } });
    if (!menu) {
      throw new BadRequestException('Menu not found');
    }
    try {
      await this.menuRepository.softRemove(menu);
      const subMenus = await this.menuRepository
        .createQueryBuilder('menu')
        .where('menu.ancestors LIKE :ancestorId', { ancestorId: `%${menu.id}%` })
        .getMany();
      if (subMenus.length > 0) {
        await this.menuRepository.softRemove(subMenus);
      }
      return { success: true, msg: '菜单删除成功' };
    } catch (e: any) {
      throw new BadRequestException('菜单删除失败');  
    }
  }
}
