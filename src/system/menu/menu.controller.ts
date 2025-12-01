import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import FrontendMenuDto from './dto/frontend-menu.dto';
import { LoggingService } from '@/common/logging/logging.service';

@Controller('system/menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('create')
  async create(@Body() createMenuDto: CreateMenuDto) {
    this.loggingService.log('POST /system/menu/create', {
      requestDescriptor: { data: createMenuDto },
    });
    await this.menuService.create(createMenuDto);
    this.loggingService.log('POST /system/menu/create success');
    return { code: 200, msg: 'Menu created', data: null };
  }

  @Get('list')
  async list(): Promise<{
    code: number;
    msg: string;
    data: (FrontendMenuDto & { children: (FrontendMenuDto & { children: any[] })[] })[];
  }> {
    this.loggingService.log('GET /system/menu/list');
    const data = await this.menuService.list();
    this.loggingService.log('GET /system/menu/list success', {
      responseDescriptor: { type: 'list', count: data.length },
    });
    return { code: 200, msg: 'Menu list fetched', data };
  }

  @Get(':id')
  async findOne(@Param('id') publicId: string) {
    this.loggingService.log('GET /system/menu/:id', {
      params: { publicId },
    });
    const data = await this.menuService.get(publicId);
    this.loggingService.log('GET /system/menu/:id success', {
      responseDescriptor: { data: { publicId } },
    });
    return { code: 200, msg: 'Menu fetched', data };
  }

  @Post('update')
  async update(@Body() updateMenuDto: UpdateMenuDto) {
    this.loggingService.log('POST /system/menu/update', {
      requestDescriptor: { data: updateMenuDto },
    });
    await this.menuService.update(updateMenuDto);
    this.loggingService.log('POST /system/menu/update success');
    return { code: 200, msg: 'Menu updated', data: null };
  }

  @Delete('delete')
  async delete(@Query('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/menu/delete', { params: { publicId } });
    await this.menuService.delete(publicId);
    this.loggingService.log('DELETE /system/menu/delete success');
    return { code: 200, msg: 'Menu deleted', data: null };
  }
}
