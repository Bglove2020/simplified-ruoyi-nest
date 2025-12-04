import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDictDataDto {
  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString({ message: '字典类型必须是字符串' })
  type: string;

  @IsNotEmpty({ message: '字典标签不能为空' })
  @IsString({ message: '字典标签必须是字符串' })
  label: string;

  @IsNotEmpty({ message: '字典键值不能为空' })
  @IsString({ message: '字典键值必须是字符串' })
  value: string;

  @IsNumber({}, { message: '排序必须是数字' })
  sortOrder: number;

  @IsIn(['0', '1'], { message: '状态必须是 0 或 1' })
  status: string;
}
