import { PartialType } from '@nestjs/mapped-types';
import { CreateDeptDto } from './create-dept.dto';
import { IsNotEmpty,IsUUID } from 'class-validator';

export class UpdateDeptDto extends PartialType(CreateDeptDto) {
    @IsNotEmpty({ message: '部门id不能为空' })
    @IsUUID('4', { message: '部门公开id格式错误' })
    publicId: string;
}
