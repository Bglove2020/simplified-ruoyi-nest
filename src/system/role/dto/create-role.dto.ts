import { IsNotEmpty, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty({ message: '角色名称不能为空' })
    @IsString({ message: '角色名称必须是字符串' })
    name: string;
    @IsNotEmpty({ message: '角色权限字符串不能为空' })
    @IsString({ message: '角色权限字符串必须是字符串' })
    roleKey: string;
    @IsNotEmpty({ message: '角色排序号不能为空' })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '角色排序号必须是数字' })
    sortOrder: number;
    @IsNotEmpty({ message: '数据范围不能为空' })
    @IsString({ message: '数据范围必须是字符串' })
    dataScope: string;
    @IsNotEmpty({ message: '角色状态不能为空' })
    @IsString({ message: '角色状态必须是字符串' })
    status: string;
    
    menuIds: string[];
}
