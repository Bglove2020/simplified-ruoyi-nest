import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDto } from './create-menu.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {
    @IsNotEmpty({ message: '菜单id不能为空' })
    @IsUUID('4', { message: '菜单id必须是UUID格式' })
    publicId: string;
}
