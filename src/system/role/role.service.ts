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
      menus = await this.menuRepository.find({
        where: { publicId: In(createRoleDto.menuIds) },
      });
      if (menus.length !== createRoleDto.menuIds.length) {
        throw new BadRequestException('Some menus were not found');
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
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        if (msg.includes(createRoleDto.name)) {
          throw new BadRequestException('角色名称已存在');
        }
        if (msg.includes(createRoleDto.roleKey)) {
          throw new BadRequestException('角色权限字符串已存在');
        }
        throw new BadRequestException('唯一键冲突');
      }
      if (code === 'ER_DATA_TOO_LONG') {
        throw new BadRequestException('字段长度超出限制');
      }
      if (code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestException('必填字段为空');
      }
      throw new BadRequestException('创建角色失败');
    }
  }

  async list() {
    return this.roleRepository.find({
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
  }

  async update(updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { publicId: updateRoleDto.publicId },
      relations: { menus: true },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    const { menuIds, ...rest } = updateRoleDto;

    Object.assign(role, rest);

    if (menuIds) {
      const menus = await this.menuRepository.find({ where: { publicId: In(menuIds) } });
      if (menus.length !== menuIds.length) {
        throw new BadRequestException('Some menus were not found');
      }
      role.menus = menus;
    }

    try {
      await this.roleRepository.save(role);
    } catch (e: any) {
      const msg = String(e?.sqlMessage || e?.message || '');
      throw new BadRequestException(`Failed to update role: ${msg}`);
    }
  }

  async delete(publicId: string) {
    const role = await this.roleRepository.findOne({
      where: { publicId },
      relations: {
        users: true,
      },
    });
    if (!role) {
      throw new BadRequestException('Role not found');
    }
    if (role.users.length > 0) {
      throw new BadRequestException('Role has associated users and cannot be deleted');
    }

    try {
      await this.roleRepository.softRemove(role);
    } catch (e: any) {
      const msg = String(e?.sqlMessage || e?.message || '');
      throw new BadRequestException(`Failed to delete role: ${msg}`);
    }
  }
}
