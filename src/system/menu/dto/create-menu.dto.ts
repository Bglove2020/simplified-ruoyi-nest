import { IsIn, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class CreateMenuDto {
    @IsNotEmpty({ message: '菜单名称不能为空' })
    @IsString({ message: '菜单名称必须是字符串' })
    name: string;

    @IsNotEmpty({ message: '父菜单id不能为空' })
    @IsUUID('4', { message: '父菜单id必须是UUID格式' })
    parentPublicId: string;//这里的parentPublicId是菜单对外公开的id，实际上是uuid

    @IsNotEmpty({ message: '菜单排序号不能为空' })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '菜单排序号必须是数字' })
    sortOrder: number;

    @IsNotEmpty({ message: '菜单状态不能为空' })
    @IsIn(['0', '1'], { message: '菜单状态必须是0或1' })
    status: '0' | '1';
}
