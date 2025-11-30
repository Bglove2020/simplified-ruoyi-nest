import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { SysRole } from './entities/role.entity';
import { SysMenu } from '../menu/entities/menu.entity';
import { SysUser } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SysRole, SysMenu,SysUser])],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
