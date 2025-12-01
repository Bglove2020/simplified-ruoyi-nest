import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysUser } from '@/system/user/entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SysDept } from '@/system/dept/entities/dept.entity';
import { SysRole } from '../role/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysUser, SysDept,SysRole])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出UserService以便AuthModule使用
})
export class UserModule {}