import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysDict } from './entities/dict.entity';
import { SysDictData } from './entities/dict-data.entity';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';

@Injectable()
export class DictService {
  constructor(
    @InjectRepository(SysDict)
    private readonly dictRepository: Repository<SysDict>,
    @InjectRepository(SysDictData)
    private readonly dictDataRepository: Repository<SysDictData>,
  ) {}

  // 已更新
  async list(): Promise<SysDict[]> {
    try {
      return await this.dictRepository.find({
        order: { sortOrder: 'ASC', createTime: 'DESC' },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
  }

  // 已更新
  async dataList(publicId: string, type: string): Promise<SysDictData[]> {
    let dict: SysDict | null = null;
    try {
      dict = await this.dictRepository.findOne({
        where: { publicId, type: type },
        relations: { dictData: true },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!dict) {
      throw new BadRequestException({ msg: '字典不存在', code: 400 });
    }
    return dict.dictData;
  }

  // 已更新
  async get(publicId: string): Promise<SysDict> {
    let dict: SysDict | null = null;
    try {
      dict = await this.dictRepository.findOne({
        where: { publicId },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!dict) {
      throw new BadRequestException({ msg: '字典类型不存在', code: 400 });
    }
    return dict;
  }

  // 已更新
  async getByType(type: string): Promise<SysDict> {
    let dict: SysDict | null = null;
    try {
      dict = await this.dictRepository.findOne({
        where: { type: type },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!dict) {
      throw new BadRequestException({ msg: '字典类型不存在', code: 400 });
    }
    return dict;
  }

  // 已更新
  async create(dto: CreateDictTypeDto): Promise<void> {
    const entity = this.dictRepository.create(dto);
    try {
      await this.dictRepository.save(entity);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库保存错误', code: 400 });
    }
  }

  // async getData(publicId: string): Promise<SysDictData> {
  //   let dictData: SysDictData | null = null;
  //   try {
  //     dictData = await this.dictDataRepository.findOne({
  //       where: { publicId },
  //       relations: { dictType: true },
  //     });
  //   } catch (e: any) {
  //     throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
  //   }
  //   if (!dictData) {
  //     throw new BadRequestException({ msg: '字典数据不存在', code: 400 });
  //   }
  //   return dictData;
  // }

  // 已更新
  async update(dto: UpdateDictTypeDto): Promise<void> {
    const dict = await this.get(dto.publicId);

    try {
      await this.dictRepository.save({ ...dict, ...dto });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库更新错误', code: 400 });
    }
  }

  // 已更新
  async delete(publicId: string): Promise<void> {
    const dict = await this.get(publicId);
    if (!dict) {
      throw new BadRequestException({ msg: '字典不存在', code: 400 });
    }
    if (dict.dictData.length > 0) {
      throw new BadRequestException({
        msg: '该字典下存在字典数据，无法删除',
        code: 400,
      });
    }
    try {
      await this.dictRepository.softRemove(dict);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库删除错误', code: 400 });
    }
  }

  // 已更新。创建时需要传入dictType
  async createData(dto: CreateDictDataDto): Promise<void> {
    let dict: SysDict | null = null;
    try {
      dict = await this.dictRepository.findOne({
        where: { type: dto.type },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!dict) {
      throw new BadRequestException({ msg: '字典不存在', code: 400 });
    }

    const dictData = this.dictDataRepository.create({
      label: dto.label,
      value: dto.value,
      sortOrder: dto.sortOrder,
      status: dto.status,
      createBy: 'system',
      updateBy: 'system',
      dict: dict,
    });

    try {
      await this.dictDataRepository.save(dictData);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库保存错误', code: 400 });
    }
  }

  // 已更新。更新字典数据时要传publicId
  async updateData(dto: UpdateDictDataDto): Promise<void> {
    const dictData = await this.dictDataRepository.findOne({
      where: { publicId: dto.publicId },
    });
    if (!dictData) {
      throw new BadRequestException({ msg: '字典数据不存在', code: 400 });
    }

    try {
      await this.dictDataRepository.save({ ...dictData, ...dto });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库更新错误', code: 400 });
    }
  }

  async deleteData(publicId: string): Promise<void> {
    let dictData: SysDictData | null = null;
    try {
      dictData = await this.dictDataRepository.findOne({
        where: { publicId },
      });
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
    }
    if (!dictData) {
      throw new BadRequestException({
        msg: '字典数据不存在或已删除',
        code: 400,
      });
    }
    try {
      await this.dictDataRepository.softRemove(dictData);
    } catch (e: any) {
      throw new BadRequestException({ msg: '数据库删除错误', code: 400 });
    }
  }

  // async getDataByType(dictType: string): Promise<SysDictData[]> {
  //   try {
  //     return await this.dictDataRepository.find({
  //       where: { dictType },
  //       relations: { dictType: true },
  //       order: { dictSort: 'ASC' },
  //     });
  //   } catch (e: any) {
  //     throw new BadRequestException({ msg: '数据库查询错误', code: 400 });
  //   }
  // }
}
