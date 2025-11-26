import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysDept } from '@/system/dept/entities/dept.entity';
import CreateUserDto from './dto/create-user.dto';
import ResetUserPasswordDto from './dto/reset-user-password.dto';
import UpdateUserDto from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
    @InjectRepository(SysDept)
    private deptRepository: Repository<SysDept>,
  ) {}

  async list():Promise<SysUser[]> {
    return this.userRepository.find({
      where: { delFlag: '0' },
      relations: {
        dept:true
      },
    });
  }

  async getByAccount(account: string): Promise<SysUser | null> {
    return this.userRepository.findOne({ 
      where: { account: account, delFlag: '0' },
    });
  }

  async getByPublicId(publicId: string): Promise<SysUser | null> {
    return this.userRepository.findOne({ 
      where: { publicId: publicId, delFlag: '0' },
      relations: {
        dept:true
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<SysUser> {
    // 如果有部门id，检查部门是否存在
    let dept: Partial<SysUser> | null;
    if(createUserDto.deptPublicId){
      dept = await this.userRepository.findOne({
        where: { publicId: createUserDto.deptPublicId, delFlag: '0' },
      });
      if (!dept) {
        throw new BadRequestException('部门不存在');
      }
    }else{
      dept = { id: 1 }
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      account: createUserDto.account,
      name: createUserDto.name,
      email: createUserDto.email,
      sex: createUserDto.sex,
      password: hashedPassword,
      // 没有部门id的话，就默认设置为根部门
      dept: { id: 1 },
      avatar: createUserDto.avatar,
      status: '1', // 默认状态为正常
      delFlag: '0', // 默认未删除
      createBy: 'system', // 系统创建
      updateBy: 'system',
    });

    try {
      return await this.userRepository.save(user);
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_NO_REFERENCED_ROW_2' || msg.includes('a foreign key constraint fails')) {
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

  async resetPassword(resetPasswordDto: ResetUserPasswordDto): Promise<boolean> {
    const user = await this.getByPublicId(resetPasswordDto.publicId);
    if (!user) {
      return false; 
    }
    user.password = await bcrypt.hash(resetPasswordDto.password, 10);
    await this.userRepository.save(user);
    return true;
  } 

  // 未完成：删除这部分的逻辑需要考虑用户是否是院系负责人，是的话不能删除。
  async deleteByAccount(account: string): Promise<{ success: boolean; msg: string; }> {
    const user = await this.getByAccount(account);
    if (!user) {
      return { success: false, msg: '用户不存在' }; 
    }
    user.delFlag = '1';
    await this.userRepository.save(user);
    return { success: true, msg: '用户删除成功' };
  }

  async deleteByAccounts(accounts: string[]): Promise<{ success: boolean; msg: string; }> {
    const users = await this.userRepository.find({
      where: { account: In(accounts), delFlag: '0' },
    });
    if (users.length === 0) {
      return { success: false, msg: '用户不存在' };
    }
    let successCount = 0;
    for (const user of users) {
      user.delFlag = '1';
      await this.userRepository.save(user);
      successCount++;
    }
    return { success: true, msg: `批量删除成功，共删除 ${successCount} 个用户，失败 ${accounts.length - successCount} 个` };
  }

  async update(updateUserDto: UpdateUserDto): Promise<{ success: boolean; msg: string; }> {
    // 检查用户是否存在
    const user = await this.getByPublicId(updateUserDto.publicId);
    if (!user) {
      return { success: false, msg: '用户不存在' };
    }

    // 遍历 updateUserDto 的所有键，针对不同字段单独处理
    for (const key in updateUserDto) {
      if (updateUserDto.hasOwnProperty(key) && updateUserDto[key] !== undefined) {
        switch (key) {

          case 'publicId':
            // publicId 用于查询，不需要更新
            break;

          case 'deptPublicId':
            // 处理部门：将 deptPublicId 转换为 dept 对象
            // 只有当部门发生变化时才查询
            if (user.dept?.publicId !== updateUserDto.deptPublicId) {
              const dept = await this.deptRepository.findOne({ where: { publicId: updateUserDto.deptPublicId, deleteFlag: '0' } });
              if (!dept) {
                throw new BadRequestException('部门不存在');
              }
              user.dept = dept;
            }
            break;
          default:
            // 其他字段直接赋值
            (user as any)[key] = updateUserDto[key];
            break;
        }
      }
    }

    try {
      await this.userRepository.save(user);
      return { success: true, msg: '用户更新成功' };
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        if (updateUserDto.account && msg.includes(updateUserDto.account)) {
          throw new BadRequestException('账号已存在');
        }
        if (updateUserDto.email && msg.includes(updateUserDto.email)) {
          throw new BadRequestException('邮箱已存在');
        }
        throw new BadRequestException('系统异常');
      }
      throw e;
    }
  }

}