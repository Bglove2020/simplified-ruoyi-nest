import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DictService } from './dict.service';
import { LoggingService } from '@/common/logging/logging.service';
import { RequirePerms } from '@/auth/decorators/perms.decorator';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';
import {
  toFrontendDictDataDto,
  toFrontendDictDataDtos,
  toFrontendDictTypeDto,
  toFrontendDictTypeDtos,
} from './mapper/dict.mapper';
import FrontendDictTypeDto from './dto/frontend-dict-type.dto';
import FrontendDictDataDto from './dto/frontend-dict-data.dto';

@Controller('/system/dict')
export class DictController {
  constructor(
    private readonly dictService: DictService,
    private readonly loggingService: LoggingService,
  ) {}

  // 已更新
  @RequirePerms('system:dict:list')
  @Get('list')
  async list(): Promise<{
    code: number;
    msg: string;
    data: FrontendDictTypeDto[];
  }> {
    this.loggingService.log('GET /system/dict/list');
    const dicts = await this.dictService.list();
    this.loggingService.log('GET /system/dict/list success', {
      responseDescriptor: { type: 'list', count: dicts.length },
    });
    return {
      code: 200,
      msg: '字典列表获取成功',
      data: toFrontendDictTypeDtos(dicts),
    };
  }

  // 已更新
  @RequirePerms('system:dict:query')
  @Get('type/:type')
  async getByType(@Param('type') type: string) {
    this.loggingService.log('GET /system/dict/type/:type', {
      params: { type },
    });
    const dict = await this.dictService.getByType(type);
    this.loggingService.log('GET /system/dict/type/:type success');
    return {
      code: 200,
      msg: '字典获取成功',
      data: toFrontendDictTypeDto(dict),
    };
  }

  // 已更新
  @RequirePerms('system:dict:query')
  @Get(':publicId')
  async get(@Param('publicId') publicId: string) {
    this.loggingService.log('GET /system/dict/:publicId', {
      params: { publicId },
    });
    const dict = await this.dictService.get(publicId);
    this.loggingService.log('GET /system/dict/:publicId success', {
      responseDescriptor: { data: toFrontendDictTypeDto(dict) },
    });
    return {
      code: 200,
      msg: '字典获取成功',
      data: toFrontendDictTypeDto(dict),
    };
  }

  // 已更新
  @RequirePerms('system:dict:add')
  @Post('create')
  async create(@Body() dto: CreateDictTypeDto) {
    this.loggingService.log('POST /system/dict/create', {
      requestDescriptor: { data: dto },
    });
    await this.dictService.create(dto);
    this.loggingService.log('POST /system/dict/create success');
    return { code: 200, msg: '字典创建成功', data: null };
  }

  // 已更新
  @RequirePerms('system:dict:edit')
  @Post('update')
  async update(@Body() dto: UpdateDictTypeDto) {
    this.loggingService.log('POST /system/dict/update', {
      requestDescriptor: { data: dto },
    });
    await this.dictService.update(dto);
    this.loggingService.log('POST /system/dict/update success');
    return { code: 200, msg: '字典更新成功', data: null };
  }

  // 已更新
  @RequirePerms('system:dict:remove')
  @Delete('delete/:publicId')
  async delete(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/dict/delete/:publicId', {
      params: { publicId },
    });
    await this.dictService.delete(publicId);
    this.loggingService.log('DELETE /system/dict/delete/:publicId success');
    return { code: 200, msg: '字典删除成功', data: null };
  }

  // 已更新
  @RequirePerms('system:dict:list')
  @Get('data/list')
  async listData(
    @Query('publicId') publicId: string,
    @Query('type') type: string,
  ): Promise<{
    code: number;
    msg: string;
    data: FrontendDictDataDto[];
  }> {
    this.loggingService.log('GET /system/dict/data/list', {
      query: { publicId, type },
    });
    console.log(publicId, type);
    const dataList = await this.dictService.dataList(publicId, type);
    this.loggingService.log('GET /system/dict/data/list success', {
      responseDescriptor: { type: 'list', count: dataList.length },
    });
    return {
      code: 200,
      msg: '字典数据列表获取成功',
      data: toFrontendDictDataDtos(dataList),
    };
  }

  // @RequirePerms('system:dict:query')
  // @Get('data/:publicId')
  // async getData(@Param('publicId') publicId: string) {
  //   this.loggingService.log('GET /system/dict/data/:publicId', {
  //     params: { publicId },
  //   });
  //   const dictData = await this.dictService.getData(publicId);
  //   this.loggingService.log('GET /system/dict/data/:publicId success');
  //   return {
  //     code: 200,
  //     msg: '字典数据获取成功',
  //     data: toFrontendDictDataDto(dictData),
  //   };
  // }

  // @Get('data/type/:dictType')
  // async getDataByType(@Param('dictType') dictType: string) {
  //   this.loggingService.log('GET /system/dict/data/type/:dictType', {
  //     params: { dictType },
  //   });
  //   const data = await this.dictService.getDataByType(dictType);
  //   this.loggingService.log('GET /system/dict/data/type/:dictType success', {
  //     responseDescriptor: { type: 'list', count: data.length },
  //   });
  //   return {
  //     code: 200,
  //     msg: '字典数据获取成功',
  //     data: toFrontendDictDataDtos(data),
  //   };
  // }

  // 已更新
  @RequirePerms('system:dict:add')
  @Post('data/create')
  async createData(@Body() dto: CreateDictDataDto) {
    this.loggingService.log('POST /system/dict/data/create', {
      requestDescriptor: { data: dto },
    });
    await this.dictService.createData(dto);
    this.loggingService.log('POST /system/dict/data/create success');
    return { code: 200, msg: '字典数据创建成功', data: null };
  }

  // 已更新
  @RequirePerms('system:dict:edit')
  @Post('data/update')
  async updateData(@Body() dto: UpdateDictDataDto) {
    this.loggingService.log('POST /system/dict/data/update', {
      requestDescriptor: { data: dto },
    });
    await this.dictService.updateData(dto);
    this.loggingService.log('POST /system/dict/data/update success');
    return { code: 200, msg: '字典数据更新成功', data: null };
  }

  // 已更新
  @RequirePerms('system:dict:remove')
  @Delete('data/delete/:publicId')
  async deleteData(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/dict/data/delete/:publicId', {
      params: { publicId },
    });
    await this.dictService.deleteData(publicId);
    this.loggingService.log(
      'DELETE /system/dict/data/delete/:publicId success',
    );
    return { code: 200, msg: '字典数据删除成功', data: null };
  }
}
