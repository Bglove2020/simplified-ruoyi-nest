import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @IsNotEmpty({ message: '角色id不能为空' })
    @IsUUID('4', { message: '角色id必须是UUID格式' })
    publicId: string;
}
