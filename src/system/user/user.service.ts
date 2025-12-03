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
    let users: SysUser[] = [];
    try{
      users = await this.userRepository.find({
      relations: {
        dept: true,
        roles: true,
      },
    });
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }
    return users;
  }

  async get(publicId: string) {
    let user: SysUser | null = null;
    try{
      user = await this.userRepository.findOne({
        where: { publicId },
        relations: {
          dept: true,
          roles: true,
        },
      });
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }
    return user;
  }

  async getByAccount(account: string): Promise<SysUser | null> {
    try{
      return this.userRepository.findOne({
        where: { account },
        relations: {
          dept: true,
          roles: true,
        },
      });
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }
  }

  async create(createUserDto: CreateUserDto){
    // 这里如果createUserDto.deptPublicId为undefined，typeorm会忽略筛选条件默认查出来第一个部门
    let dept: SysDept | null = null;
    try{
      dept = await this.deptRepository.findOne({
        where: { publicId: createUserDto.deptPublicId },
      });
      if (!dept) {
        throw new BadRequestException({msg: '部门不存在', code: 400});
      }
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }

    let roles: Partial<SysRole>[] = [];
    if(createUserDto.rolePublicIds && createUserDto.rolePublicIds.length > 0){
      try{
        roles = await this.roleRepository.find({
          where: { publicId: In(createUserDto.rolePublicIds) },
        });
      }catch(e: any){
        throw new BadRequestException({msg: '数据库查询错误', code: 400});
      }
      if (roles.length !== createUserDto.rolePublicIds.length) {
        throw new BadRequestException({msg: '部分角色不存在', code: 400});
      }
    }
    else{
      roles = [{id:1}];
    }


    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      account: createUserDto.account,
      name: createUserDto.name,
      email: createUserDto.email,
      sex: createUserDto.sex,
      password: hashedPassword,
      dept: dept,
      roles: roles,
      avatar: createUserDto.avatar,
      status: '1',
      createBy: 'system',
      updateBy: 'system',
    });

    try {
      await this.userRepository.save(user);
    } catch (e: any) {
      throw new BadRequestException({msg: '数据库保存错误', code: 400});
    }
  }

  async resetPassword(resetPasswordDto: ResetUserPasswordDto){
    let user: SysUser | null = null;
    try{
      user = await this.userRepository.findOne({
        where: { publicId: resetPasswordDto.publicId },
      });
      if (!user) {
        throw new BadRequestException({msg: '用户不存在', code: 400});
      }
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库更新错误', code: 400});
    }
    user.password = await bcrypt.hash(resetPasswordDto.password, 10);
    try{
      await this.userRepository.save(user);
    }catch(e: any){
      throw new BadRequestException({msg: '数据库更新错误', code: 400});
    }
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
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }

    if(!user){
      throw new BadRequestException({msg: '用户不存在', code: 400});
    }
    if (user.leaderDepts.length > 0) {
      throw new BadRequestException({msg: '用户是院系负责人，不能删除', code: 400});
    }

    try{
      await this.userRepository.softRemove(user);
    }catch(e: any){
      throw new BadRequestException({msg: '数据库删除错误', code: 400});
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
        throw new BadRequestException({msg: '数据库更新错误', code: 400});
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
        throw new BadRequestException({msg: '数据库更新错误', code: 400});
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
