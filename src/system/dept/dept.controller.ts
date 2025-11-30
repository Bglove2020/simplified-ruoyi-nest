import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { SysDept } from './entities/dept.entity';
import FrontendDeptDto from './dto/frontend-dept.dto';
import { LoggingService } from '@/common/logging/logging.service';


@Controller('system/dept')
export class DeptController {
  constructor(
    private readonly deptService: DeptService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('create')
  create(@Body() createDeptDto: CreateDeptDto) {
    return this.deptService.create(createDeptDto);
  }

  @Get('list')
  async list(): Promise<(FrontendDeptDto & { children: (FrontendDeptDto & { children: any[] })[] })[]> {
    this.loggingService.log('GET /system/dept/list');
    const result = await this.deptService.list();
    this.loggingService.log('GET /system/dept/list success', {responseDescriptor: {type: 'list',count: result.length}});
    return result;
  }
  
  @Post('update')
  update(@Body() updateDeptDto: UpdateDeptDto) {
    return this.deptService.update(updateDeptDto);
  }


  @Delete('delete')
  async delete(@Query('publicId') publicId: string) {
    return await this.deptService.delete(publicId);
  }
}
