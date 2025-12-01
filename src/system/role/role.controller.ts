import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { LoggingService } from '@/common/logging/logging.service';
import FrontendRoleDto from './dto/frontend-role.dto';
import { toFrontendDtoList } from './mapper/to-frontend-user.mapper';

@Controller('system/role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('create')
  async create(@Body() createRoleDto: CreateRoleDto) {
    this.loggingService.log('POST /system/role/create', {
      requestDescriptor: { data: createRoleDto },
    });
    await this.roleService.create(createRoleDto);
    this.loggingService.log('POST /system/role/create success');
    return { code: 200, msg: '角色创建成功', data: null };
  }

  @Get('list')
  async list() {
    this.loggingService.log('GET /system/role/list');
    const roles = await this.roleService.list();
    const data: FrontendRoleDto[] = toFrontendDtoList(roles);
    this.loggingService.log('GET /system/role/list success', {
      responseDescriptor: { type: 'list', count: data.length },
    });
    return { code: 200, msg: '角色列表获取成功', data };
  }

  @Post('update')
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    this.loggingService.log('POST /system/role/update', {
      requestDescriptor: { data: updateRoleDto },
    });
    await this.roleService.update(updateRoleDto);
    this.loggingService.log('POST /system/role/update success');
    return { code: 200, msg: '角色更新成功', data: null };
  }

  @Delete('delete/:publicId')
  async delete(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/role/delete/:publicId', {
      params: { publicId },
    });
    await this.roleService.delete(publicId);
    this.loggingService.log('DELETE /system/role/delete/:publicId success');
    return { code: 200, msg: '角色删除成功', data: null };
  }
}
