import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SysRole } from './entities/role.entity';
import { SysMenu } from '../menu/entities/menu.entity';
import { SysUser } from '../user/entities/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(SysRole)
    private roleRepository: Repository<SysRole>,
    @InjectRepository(SysMenu)
    private menuRepository: Repository<SysMenu>,
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<void> {
    let menus: SysMenu[] = [];
    if (createRoleDto.menuIds && createRoleDto.menuIds.length > 0) {
      try {
        menus = await this.menuRepository.find({
          where: { publicId: In(createRoleDto.menuIds) },
        });
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }
      if (menus.length !== createRoleDto.menuIds.length) {
        throw new BadRequestException({ msg: '部分菜单不存在', code: 400 });
      }
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      roleKey: createRoleDto.roleKey,
      sortOrder: createRoleDto.sortOrder,
      dataScope: createRoleDto.dataScope,
      status: createRoleDto.status,
      createBy: 'system',
      updateBy: 'system',
      menus,
    });

    try {
      await this.roleRepository.save(role);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库保存错误', code: 400 });
    }
  }

  async list() {
    try {
      return await this.roleRepository.find({
        relations: {
          menus: true,
        },
        select: {
          publicId: true,
          name: true,
          roleKey: true,
          sortOrder: true,
          status: true,
          menus: {
            publicId: true,
          },
        },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
  }

  async update(updateRoleDto: UpdateRoleDto) {
    let role: SysRole | null = null;
    try {
      role = await this.roleRepository.findOne({
        where: { publicId: updateRoleDto.publicId },
        relations: { menus: true },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!role) {
      throw new BadRequestException({ msg: '角色不存在', code: 400 });
    }
    const { menuIds, ...rest } = updateRoleDto;

    Object.assign(role, rest);

    if (menuIds) {
      let menus: SysMenu[] = [];
      try {
        menus = await this.menuRepository.find({ where: { publicId: In(menuIds) } });
      } catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }
      if (menus.length !== menuIds.length) {
        throw new BadRequestException({ msg: '部分菜单不存在', code: 400 });
      }
      role.menus = menus;
    }

    try {
      await this.roleRepository.save(role);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库更新错误', code: 400 });
    }
  }

  async delete(publicId: string) {
    let role: SysRole | null = null;
    try {
      role = await this.roleRepository.findOne({
        where: { publicId },
        relations: {
          users: true,
        },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!role) {
      throw new BadRequestException({ msg: '角色不存在', code: 400 });
    }
    if (role.users.length > 0) {
      throw new BadRequestException({ msg: '角色有关联用户，不能删除', code: 400 });
    }

    try {
      await this.roleRepository.softRemove(role);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库删除错误', code: 400 });
    }
  }
}
