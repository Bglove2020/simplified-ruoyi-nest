import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import FrontendMenuDto from './dto/frontend-menu.dto';
import { SysMenu } from './entities/menu.entity';
import { Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { buildTree } from '@/common/utils/build-tree.util';
import { toFrontendDto } from './mapper/to-fronted_menu';
import { of } from 'rxjs';

@Injectable()
export class MenuService {

  constructor(
    @InjectRepository(SysMenu)
    private menuRepository: Repository<SysMenu>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const menu = this.menuRepository.create(createMenuDto);
    if (createMenuDto.parentPublicId) {
      const parentMenu = await this.menuRepository.findOne({ where: { publicId: createMenuDto.parentPublicId } });
      if (!parentMenu) {
        throw new BadRequestException('父菜单不存在');
      }
      menu.parentId = parentMenu.id;
      menu.ancestors = parentMenu.ancestors + ',' + parentMenu.id;
    }
    else{
      menu.parentId = 0;
      menu.ancestors = '0';
    }
    try {
      await this.menuRepository.save(menu);
      return { success: true, msg: '菜单创建成功' };
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

  findOne(id: number) {
    return `This action returns a #${id} menu`;
  }

  async update(updateMenuDto: UpdateMenuDto) {
    let menu: SysMenu|null;
    try{
      menu = await this.menuRepository.findOne({ where: { publicId: updateMenuDto.publicId } });
      if (!menu) {
        throw new BadRequestException('菜单不存在');
      }
    } catch (e: any) {
      throw new BadRequestException('菜单更新失败');
    }

    try{
      await this.menuRepository.save({...menu,...updateMenuDto});
      return { success: true, msg: '菜单更新成功' };
    } catch (e: any) {
      throw new BadRequestException('菜单更新失败');
    }
  }

  async delete(publicId: string) {
    const menu = await this.menuRepository.findOne({ where: { publicId } });
    if (!menu) {
      throw new BadRequestException('菜单不存在');
    }
    try{
      await this.menuRepository.softRemove(menu);
      // 通过ancestor字段查询所有子菜单，进行软删除
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
