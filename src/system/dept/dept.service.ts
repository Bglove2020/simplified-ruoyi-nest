import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { SysDept } from './entities/dept.entity';
import { Repository, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { buildTree } from '@/common/utils/build-tree.util';
import FrontendDeptDto from './dto/frontend-dept.dto';
import { toFrontendDeptDto } from './mapper/dept.mapper';
import { SysUser } from '../user/entities/user.entity';


@Injectable()
export class DeptService {

  constructor(
    @InjectRepository(SysDept)
    private deptRepository: Repository<SysDept>,
    @InjectRepository(SysUser)
    private userRepository: Repository<SysUser>,
  ) {}

  async create(createDeptDto: CreateDeptDto) {
    // 根据父部门的publicId，获取父部门
    const parentDept = await this.deptRepository.findOne({ where: { publicId: createDeptDto.parentPublicId } });
    if (!parentDept) {
      throw new BadRequestException('父部门不存在');
    }

    // 如果有负责人字段，根据leaderPublicId查询负责人
    let leader: SysUser | null = null;
    if (createDeptDto.leaderPublicId) {
      leader = await this.userRepository.findOne({ where: { publicId: createDeptDto.leaderPublicId } });
      if (!leader) {
        throw new BadRequestException('负责人不存在');
      }
    }

    // 创建部门
    const dept = this.deptRepository.create({
      name: createDeptDto.name,
      parentId: parentDept.id,
      leader: leader ? leader : null,
      sortOrder: createDeptDto.sortOrder,
      status: createDeptDto.status,
      ancestors: parentDept.ancestors + ',' + parentDept.id,
    }); 
    try {
      return await this.deptRepository.save(dept);
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('部门名称已存在');
      }
      if (code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestException('必填字段为空');
      }
      throw new BadRequestException('创建部门失败');
    }
  }

  async list() {
    const flatData = await this.deptRepository.find({ relations: { leader: true } });
    return buildTree<SysDept, FrontendDeptDto>(flatData, toFrontendDeptDto);
  }

  // findOne(id: number) {
  //   return this.deptRepository.findOne({ where: { id }, relations: { leader: true } });
  // }

  async update(updateDeptDto: UpdateDeptDto) {
    // 根据publicId查询部门
    const dept = await this.deptRepository.findOne({ where: { publicId: updateDeptDto.publicId } });
    if (!dept) {
      throw new BadRequestException('部门不存在');
    }

    // 如果有父部门字段，根据parentPublicId查询父部门
    if (updateDeptDto.parentPublicId) {
        throw new BadRequestException('不允许修改父部门');
    }

    // 如果有负责人字段，根据leaderPublicId查询负责人
    if (updateDeptDto.leaderPublicId && updateDeptDto.leaderPublicId !== dept.leader?.publicId) {
      dept.leader = await this.userRepository.findOne({ where: { publicId: updateDeptDto.leaderPublicId } });
      if (!dept.leader) {
        throw new BadRequestException('负责人不存在');
      }
    }

    // 更新其他字段
    if (updateDeptDto.name !== undefined) {
      dept.name = updateDeptDto.name;
    }
    if (updateDeptDto.sortOrder !== undefined) {
      dept.sortOrder = updateDeptDto.sortOrder;
    }
    if (updateDeptDto.status !== undefined) {
      dept.status = updateDeptDto.status;
    }

    try {
      const result = await this.deptRepository.save(dept);
      return { success: true, msg: '更新部门成功' };
    } catch (e: any) {
      const code = e?.code;
      const msg = String(e?.sqlMessage || e?.message || '');
      if (code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('部门名称已存在');
      }
      if (code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestException('必填字段为空');
      }
      throw new BadRequestException('更新部门失败');
    }
  }

  async delete(publicId: string) {
    // 根据publicId查询部门
    const dept = await this.deptRepository.findOne({ where: { publicId } });
    if (!dept) {
      throw new BadRequestException('部门不存在或已被删除');
    }
    
    // 查找所有ancestors中包含此部门id的子部门
    // 使用FIND_IN_SET函数在逗号分隔的字符串中查找id
    const childDepts = await this.deptRepository
      .createQueryBuilder('dept')
      .where('FIND_IN_SET(:deptId, dept.ancestors) > 0', { deptId: dept.id })
      .getMany();

    // 收集所有要删除的部门id（当前部门 + 所有子部门）
    const deptIds = [dept.id, ...childDepts.map(child => child.id)];

    // 查找所有属于这些部门的用户（未删除的）
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.dept', 'dept')
      .where('user.dept_id IN (:...deptIds)', { deptIds })
      .getMany();

    // 软删除所有相关用户
    if (users.length > 0) {
      await this.userRepository.softRemove(users);
    }

    try {
      // 批量软删除（当前部门 + 所有子部门）
      await this.deptRepository.softRemove([dept, ...childDepts]);
      
      const childCount = childDepts.length;
      const userCount = users.length;
      let msg = '删除部门成功';
      if (childCount > 0 && userCount > 0) {
        msg = `删除部门成功，同时删除了 ${childCount} 个子部门和 ${userCount} 个用户`;
      } else if (childCount > 0) {
        msg = `删除部门成功，同时删除了 ${childCount} 个子部门`;
      } else if (userCount > 0) {
        msg = `删除部门成功，同时删除了 ${userCount} 个用户`;
      }
      return { success: true, msg };
    } catch (e: any) {
      throw new BadRequestException('删除部门失败');
    }
  }
}

