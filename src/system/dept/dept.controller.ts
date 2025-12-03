import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { DeptService } from './dept.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import FrontendDeptDto from './dto/frontend-dept.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { RequirePerms } from '@/auth/decorators/perms.decorator';

@Controller('system/dept')
export class DeptController {
  constructor(
    private readonly deptService: DeptService,
    private readonly loggingService: LoggingService,
  ) {}

  @RequirePerms('system:dept:add')
  @Post('create')
  async create(@Body() createDeptDto: CreateDeptDto) {
    this.loggingService.log('POST /system/dept/create', {
      requestDescriptor: { data: createDeptDto },
    });
    await this.deptService.create(createDeptDto);
    this.loggingService.log('POST /system/dept/create success');
    return { code: 200, msg: '创建成功', data: null };
  }

  @RequirePerms('system:dept:list')
  @Get('list')
  async list(): Promise<{
    code: number;
    msg: string;
    data: (FrontendDeptDto & {
      children: (FrontendDeptDto & { children: any[] })[];
    })[];
  }> {
    this.loggingService.log('GET /system/dept/list');
    const result = await this.deptService.list();
    this.loggingService.log('GET /system/dept/list success', {
      responseDescriptor: { type: 'list', count: result.length },
    });
    return { code: 200, msg: '查询成功', data: result };
  }

  @RequirePerms('system:dept:update')
  @Post('update')
  async update(@Body() updateDeptDto: UpdateDeptDto) {
    this.loggingService.log('POST /system/dept/update', {
      requestDescriptor: { data: updateDeptDto },
    });
    await this.deptService.update(updateDeptDto);
    this.loggingService.log('POST /system/dept/update success');
    return { code: 200, msg: '更新成功', data: null };
  }

  @RequirePerms('system:dept:delete')
  @Delete('delete')
  async delete(@Query('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/dept/delete', {
      params: { publicId },
    });
    const { childCount, userCount } = await this.deptService.delete(publicId);
    const hasChild = childCount > 0;
    const hasUser = userCount > 0;
    let msg = '删除成功';
    if (hasChild && hasUser) {
      msg = `删除成功，包含${childCount}个子部门和${userCount}个用户`;
    } else if (hasChild) {
      msg = `删除成功，包含${childCount}个子部门`;
    } else if (hasUser) {
      msg = `删除成功，包含${userCount}个用户`;
    }
    this.loggingService.log('DELETE /system/dept/delete success', {
      responseDescriptor: { data: { msg, childCount, userCount } },
    });
    return { code: 200, msg, data: null };
  }
}
