import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDictTypeDto {
  @IsNotEmpty({ message: '字典名称不能为空' })
  @IsString({ message: '字典名称必须是字符串' })
  name: string;

  @IsNotEmpty({ message: '字典类型不能为空' })
  @IsString({ message: '字典类型必须是字符串' })
  type: string;

  @IsIn(['0', '1'], { message: '状态必须是 0 或 1' })
  status: string;

  @IsNumber({}, { message: '排序必须是数字' })
  sortOrder: number;
}
