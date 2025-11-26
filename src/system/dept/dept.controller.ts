import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { SysDept } from './entities/dept.entity';
import FrontendDeptDto from './dto/frontend-dept.dto';


@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Post('create')
  create(@Body() createDeptDto: CreateDeptDto) {
    return this.deptService.create(createDeptDto);
  }

  @Get('list')
  async list(): Promise<(FrontendDeptDto & { children: (FrontendDeptDto & { children: any[] })[] })[]> {
    return await this.deptService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deptService.findOne(+id);
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
