import { Module } from '@nestjs/common';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysDept } from './entities/dept.entity';
import { SysUser } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysDept, SysUser])],
  controllers: [DeptController],
  providers: [DeptService],
})
export class DeptModule {}
