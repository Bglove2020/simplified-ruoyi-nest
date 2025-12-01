import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, IsNull, Repository } from 'typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysDept } from '@/system/dept/entities/dept.entity';
import CreateUserDto from './dto/create-user.dto';
import ResetUserPasswordDto from './dto/reset-user-password.dto';
import UpdateUserDto from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { SysRole } from '../role/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysDept)
    private deptRepository: Repository<SysDept>,
    @InjectRepository(SysRole)
    private roleRepository: Repository<SysRole>,
  ) {}

  async list(): Promise<SysUser[]> {
    return this.userRepository.find({
      relations: {
        dept: true,
        roles: true,
      },
    });
  }

  async get(publicId: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { publicId },
      relations: {
        dept: true,
        roles: true,
      },
    });
  }

  async getByAccount(account: string): Promise<SysUser | null> {
    return this.userRepository.findOne({
      where: { account },
      relations: {
        dept: true,
        roles: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<SysUser> {
    // 如果有部门id，检查部门是否存在
    let dept: Partial<SysDept> | null;
    if (createUserDto.deptPublicId) {
      dept = await this.deptRepository.findOne({
        where: { publicId: createUserDto.deptPublicId },
      });
      if (!dept) {
        throw new BadRequestException('部门不存在');
      }
    } else {
      dept = { id: 1 };
    }

    let roles: SysRole[] = [];
    if (createUserDto.rolePublicIds && createUserDto.rolePublicIds.length > 0) {
      roles = await this.roleRepository.find({
        where: { publicId: In(createUserDto.rolePublicIds) },
      }); 
      if (roles.length !== createUserDto.rolePublicIds.length) {
        throw new BadRequestException('部分角色不存在');
      }
    } else {
      throw new BadRequestException('用户角色不能为空');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      account: createUserDto.account,
      name: createUserDto.name,
      email: createUserDto.email,
      sex: createUserDto.sex,
      password: hashedPassword,
      // 没有部门id的话，就默认设置为根部门
      dept: dept,
      roles: roles,
      avatar: createUserDto.avatar,
      status: '1', // 默认状态为正常
      createBy: 'system', // 系统创建
      updateBy: 'system',
    });

    try {
      return await this.userRepository.save(user);
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (
        code === 'ER_NO_REFERENCED_ROW_2' ||
        msg.includes('a foreign key constraint fails')
      ) {
        throw new BadRequestException('部门不存在');
      }
      if (code === 'ER_DUP_ENTRY') {
        if (msg.includes(createUserDto.account)) {
          throw new BadRequestException('账号已存在');
        }
        if (msg.includes(createUserDto.email)) {
          throw new BadRequestException('邮箱已存在');
        }
        throw new BadRequestException('唯一键冲突');
      }
      if (code === 'ER_DATA_TOO_LONG') {
        throw new BadRequestException('字段长度超出限制');
      }
      if (code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestException('必填字段为空');
      }
      throw e;
    }
  }

  async resetPassword(
    resetPasswordDto: ResetUserPasswordDto,
  ): Promise<boolean> {
    const user = await this.get(resetPasswordDto.publicId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    user.password = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.userRepository.save(user);
    return true;
  }


  async delete(publicId: string){
    let user: SysUser | null = null;
    try{
      user = await this.userRepository.findOne({
        where: { publicId },
        relations: {
          dept: true,
          leaderDepts: true,
        },
      });
    } catch (e: any) {
      throw new BadRequestException('数据库查询错误');
    }

    console.log('delete user:',user);
    if(!user){
      throw new BadRequestException('用户不存在');
    }
    if (user.leaderDepts.length > 0) {
      // throw new BadRequestException('用户是院系负责人，不能删除');
      // throw new HttpException({message: '用户是院系负责人，不能删除'}, HttpStatus.BAD_REQUEST);
      throw new HttpException({msg: '用户是院系负责人，不能删除', code: 400}, HttpStatus.BAD_REQUEST);
      // throw new Error('用户是院系负责人，不能删除');
    }

    try{
      await this.userRepository.softRemove(user);
    }catch(e: any){
      throw new BadRequestException('数据库删除错误');
    }
  }

  async update(updateUserDto: UpdateUserDto){
    // 检查用户是否存在
    console.log('updateUserDto.publicId',updateUserDto.publicId);
    let user: SysUser | null = null;
    try{
      user = await this.userRepository.findOne({
        where: { publicId: updateUserDto.publicId },
        relations: {
          dept: true,
          roles: true,
        },
      });
      console.log('user',user);
    }catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }

    if (!user) {
      throw new BadRequestException({msg: '用户不存在', code: 400});
    }

    const { deptPublicId, rolePublicIds, ...rest } = updateUserDto;
    Object.assign(user, rest);

    // 如果有deptPublicId，且与当前院系不同，则更新院系
    if (updateUserDto.deptPublicId && updateUserDto.deptPublicId !== user.dept?.publicId) {
      try{
        const dept = await this.deptRepository.findOne({
          where: { publicId: updateUserDto.deptPublicId },
        });
        if (!dept) {
          throw new BadRequestException({msg: '部门不存在', code: 400});
        }
        user.dept = dept;
      }catch(e: any){
        throw new BadRequestException({msg: '数据库查询错误', code: 400});
      }
    }

    // 如果有rolePublicIds，则更新角色，不需要不同
    if (updateUserDto.rolePublicIds) {
      try{
        const roles = await this.roleRepository.find({
          where: { publicId: In(updateUserDto.rolePublicIds) },
        });
        if (roles.length !== updateUserDto.rolePublicIds.length) {
          throw new BadRequestException({msg: '部分角色不存在', code: 400});
        }
        console.log('updateUserDto.rolePublicIds:',updateUserDto.rolePublicIds);
        console.log('roles:',roles);
        user.roles = roles;
      }catch(e: any){
        throw new BadRequestException({msg: '数据库查询错误', code: 400});
      }
    }
    console.log('user:',user);
    try {
      await this.userRepository.save(user);
    } catch (e: any) {
      throw new BadRequestException({msg: '数据库更新错误', code: 400});
    }
  }
}
