import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import FrontendMenuDto from './dto/frontend-menu.dto';

@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('create')
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto);
  }

  @Get('list')
  async list(): Promise<(FrontendMenuDto & { children: (FrontendMenuDto & { children: any[] })[] })[]> {
    return await this.menuService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(+id);
  }

  @Post('update')
  update(@Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(updateMenuDto);
  }

  @Delete('delete')
  async delete(@Query('publicId') publicId: string) {
    return await this.menuService.delete(publicId);
  }
}
