import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { SysRole } from './entities/role.entity';
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
    this.loggingService.log('POST /system/role/create', {requestDescriptor: {data: createRoleDto}});
    const result = await this.roleService.create(createRoleDto);
    if(result){
      this.loggingService.log('POST /system/role/create success', {responseDescriptor: {data: result}});
      return {success: true, msg: '角色创建成功'};
    }else{
      this.loggingService.log('POST /system/role/create failed', {responseDescriptor: {data: result}});
      return {success: false, msg: '角色创建失败'};
    }
  }

  @Get('list')
  async list(){
    let data: FrontendRoleDto[] = [];
    try{
      const roles = await this.roleService.list();
      data = toFrontendDtoList(roles);
      this.loggingService.log('GET /system/role/list success', {responseDescriptor: {type: 'list',count: data.length}});
    }catch(error){
      this.loggingService.error('GET /system/role/list error', error);
      return {success: false, msg: '角色列表查询失败'};
    }
    return {success: true, msg: '角色列表查询成功', data: data};
  }

  @Post('update')
  async update(@Body() updateRoleDto: UpdateRoleDto) {
    this.loggingService.log('POST /system/role/update', {requestDescriptor: {data: updateRoleDto}});
    const result = await this.roleService.update(updateRoleDto);
    if(result){
      this.loggingService.log('POST /system/role/update success', {responseDescriptor: {data: result}});
      return {success: true, msg: '角色更新成功'};
    }else{
      this.loggingService.log('POST /system/role/update failed', {responseDescriptor: {data: result}});
      return {success: false, msg: '角色更新失败'};
    }
  }


  @Delete(':id')
  async delete(@Query('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/role/:id', {requestDescriptor: {data: publicId}});
    const result = await this.roleService.delete(publicId);
    if(result){
      this.loggingService.log('DELETE /system/role/:id success', {responseDescriptor: {data: result}});
      return {success: true, msg: '角色删除成功'};
    }else{
      this.loggingService.log('DELETE /system/role/:id failed', {responseDescriptor: {data: result}});
      return {success: false, msg: '角色删除失败'};
    }
  }
}
