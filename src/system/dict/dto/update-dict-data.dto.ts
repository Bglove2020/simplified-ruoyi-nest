import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateDictDataDto } from './create-dict-data.dto';

export class UpdateDictDataDto extends PartialType(CreateDictDataDto) {
  @IsNotEmpty({ message: '字典数据ID不能为空' })
  @IsString({ message: '字典数据ID必须是字符串' })
  publicId: string;
}
