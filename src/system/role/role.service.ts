import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { randomUUID } from 'crypto';
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

  async create(createRoleDto: CreateRoleDto): Promise<SysRole> {


    // 如果有菜单ID，查询对应的菜单
    let menus: SysMenu[] = [];
    if (createRoleDto.menuIds && createRoleDto.menuIds.length > 0) {
      menus = await this.menuRepository.find({
        where: { publicId: In(createRoleDto.menuIds) },
      });
      if (menus.length !== createRoleDto.menuIds.length) {
        throw new BadRequestException('部分菜单不存在');
      }
    }

    // 创建角色实体
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      roleKey: createRoleDto.roleKey,
      sortOrder: createRoleDto.sortOrder,
      dataScope: createRoleDto.dataScope,
      status: createRoleDto.status,
      delFlag: '0', // 默认未删除
      createBy: 'system', // 系统创建
      updateBy: 'system',
      menus: menus, // 关联菜单
    });

    try {
      return this.roleRepository.save(role);
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

  list() {
    return this.roleRepository.find({
      where: { delFlag: '0' }, 
      // 指定要添加的关系
      relations: {
        menus: true,
      },
      // 指定要查询的字段
      select:{
        publicId: true,
        name: true,
        roleKey: true,
        sortOrder: true,
        status: true,
        menus:{
          publicId: true
        },
      },
    });
  }


  async update(updateRoleDto: UpdateRoleDto){
    const role = await this.roleRepository.findOne({ 
      where: { publicId: updateRoleDto.publicId },
      relations: { menus: true }, // 需要加载 menus 关系才能更新
    });
    if (!role) {
      return { success: false, msg: '角色不存在' };
    }
    const {menuIds, ...rest} = updateRoleDto;
    
    // 更新普通字段
    Object.assign(role, rest);
    
    // 更新多对多关系（菜单）
    if(menuIds){
      const menus = await this.menuRepository.find({ where: { publicId: In(menuIds) } });
      if(menus.length !== menuIds.length){
        return { success: false, msg: '部分菜单不存在' };
      }
      role.menus = menus;
    }
    // TypeORM 的 update() 方法不能更新多对多关系。它只能更新实体的直接字段，不能处理关联关系（如 menus）。
    // 使用 save 方法保存
    try {
      await this.roleRepository.save(role);
      return { success: true, msg: '角色更新成功' };
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async delete(publicId: string) {
    const role = await this.roleRepository.findOne({ 
      where: { publicId: publicId, delFlag: '0' } ,
      relations: {
        users: true,
      },
    });
    console.log('delete role:',role);
    if(!role || role.users.length > 0){
      return { success: false, msg: '角色存在用户，不能删除' };
    }
    role.delFlag = '1';
    try{
      await this.roleRepository.save(role);
      return { success: true, msg: '角色删除成功' };
    }catch(e: any){
      return { success: false, msg: '角色删除失败' };
    }
  }
}
