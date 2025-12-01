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
    return { code: 200, msg: 'Role created', data: null };
  }

  @Get('list')
  async list() {
    const roles = await this.roleService.list();
    const data: FrontendRoleDto[] = toFrontendDtoList(roles);
    this.loggingService.log('GET /system/role/list success', {
      responseDescriptor: { type: 'list', count: data.length },
    });
    return { code: 200, msg: 'Role list fetched', data };
  }

  @Post('update')
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    this.loggingService.log('POST /system/role/update', {
      requestDescriptor: { data: updateRoleDto },
    });
    await this.roleService.update(updateRoleDto);
    this.loggingService.log('POST /system/role/update success');
    return { code: 200, msg: 'Role updated', data: null };
  }

  @Delete('delete/:publicId')
  async delete(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/role/delete/:publicId', {
      params: { publicId },
    });
    await this.roleService.delete(publicId);
    this.loggingService.log('DELETE /system/role/delete/:publicId success');
    return { code: 200, msg: 'Role deleted', data: null };
  }
}
