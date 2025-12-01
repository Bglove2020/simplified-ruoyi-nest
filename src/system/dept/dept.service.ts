import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { SysDept } from './entities/dept.entity';
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
  ) { }

  async create(createDeptDto: CreateDeptDto) {

    // 如果没有传父部门publicId，则默认为顶级部门，父部门id为0
    let parentDept: SysDept | null = null;
    if (createDeptDto.parentPublicId) {
      parentDept = await this.deptRepository.findOne({
        where: { publicId: createDeptDto.parentPublicId },
      });
      if (!parentDept) {
        throw new BadRequestException({ msg: '父部门不存在', code: 400 });
      }
    }

    // 如果有负责人字段，根据leaderPublicId查询负责人
    let leader: SysUser | null = null;
    if (createDeptDto.leaderPublicId) {
      try {
        leader = await this.userRepository.findOne({
          where: { publicId: createDeptDto.leaderPublicId },
        });
        if (!leader) {
          throw new BadRequestException({ msg: '负责人不存在', code: 400 });
        }
      }
      catch (e: any) {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }
    }

    const dept = this.deptRepository.create({
      name: createDeptDto.name,
      parentId: parentDept?.id ?? 0,
      leader: leader ? leader : null,
      sortOrder: createDeptDto.sortOrder,
      status: createDeptDto.status,
      ancestors: parentDept ? `${parentDept.ancestors},${parentDept.id}` : '0',
    });

    try {
      await this.deptRepository.save(dept);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库保存错误', code: 400 });
    }
  }

  async list() {
    let result: SysDept[] = [];
    try {
      result = await this.deptRepository.find({ relations: { leader: true } });
    }
    catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }

    return buildTree<SysDept, FrontendDeptDto>(result, toFrontendDeptDto);
  }

  async update(updateDeptDto: UpdateDeptDto) {
    let dept: SysDept | null = null;
    try {
      dept = await this.deptRepository.findOne({ where: { publicId: updateDeptDto.publicId } });
      if (!dept) {
        throw new BadRequestException({ msg: '部门不存在', code: 400 });
      }
    }
    catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }


    if (updateDeptDto.parentPublicId) {
      throw new BadRequestException({ msg: '不允许更新父部门', code: 400 });
    }
    const { leaderPublicId, ...rest } = updateDeptDto;
    Object.assign(dept, rest);

    // 如果有负责人字段，根据leaderPublicId查询负责人
    if (leaderPublicId && leaderPublicId !== dept.leader?.publicId) {
      try {
        dept.leader = await this.userRepository.findOne({ where: { publicId: leaderPublicId } });
        if (!dept.leader) {
          throw new BadRequestException({ msg: '负责人不存在', code: 400 });
        }
      } catch {
        throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
      }
    }

    try {
      await this.deptRepository.save(dept);
    } catch (e: any) {
      throw new BadRequestException({msg: '数据库更新错误', code: 400});
    }
  }

  async delete(publicId: string) {
    let dept: SysDept | null = null;
    try{
      dept = await this.deptRepository.findOne({ where: { publicId } });
      if (!dept) {
        throw new BadRequestException({msg: '部门不存在或已删除', code: 400});
      }
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }

    let childDepts: SysDept[] = [];
    try{
      childDepts = await this.deptRepository
        .createQueryBuilder('dept')
        .where('FIND_IN_SET(:deptId, dept.ancestors) > 0', { deptId: dept.id })
        .getMany();
        await this.deptRepository.softRemove([dept, ...childDepts]);
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }



    let users: SysUser[] = [];
    try{
      const deptIds = [dept.id, ...childDepts.map(child => child.id)];
      users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.dept', 'dept')
      .where('user.dept_id IN (:...deptIds)', { deptIds })
      .getMany();
      await this.userRepository.softRemove(users);
    }
    catch(e: any){
      throw new BadRequestException({msg: '数据库查询错误', code: 400});
    }

    return { childCount: childDepts.length, userCount: users.length };
  }
}
