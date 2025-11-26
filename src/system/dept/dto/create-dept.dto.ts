import { IsNotEmpty, IsString, IsIn, IsUUID, IsNumber } from 'class-validator';

export class CreateDeptDto {
    @IsNotEmpty({ message: '部门名称不能为空' })
    @IsString({ message: '部门名称必须是字符串' })
    name: string;

    @IsNotEmpty({ message: '父部门id不能为空' })
    @IsUUID('4', { message: '父部门id必须是UUID格式' })
    parentPublicId: string;//这里的parentPublicId是部门对外公开的id，实际上是uuid

    @IsNotEmpty({ message: '部门排序号不能为空' })
    @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '部门排序号必须是数字' })
    sortOrder: number;

    @IsNotEmpty({ message: '负责人id不能为空' })
    @IsUUID('4', { message: '负责人id必须是UUID格式' })
    leaderPublicId: string;

    @IsNotEmpty({ message: '部门状态不能为空' })
    @IsIn(['0', '1'], { message: '部门状态必须是0或1' })
    status: '0' | '1';

}
