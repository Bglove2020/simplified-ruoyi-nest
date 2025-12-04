import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateDictTypeDto } from './create-dict-type.dto';

export class UpdateDictTypeDto extends PartialType(CreateDictTypeDto) {
  @IsNotEmpty({ message: '字典类型ID不能为空' })
  @IsString({ message: '字典类型ID必须是字符串' })
  publicId: string;
}
