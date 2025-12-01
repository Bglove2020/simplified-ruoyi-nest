import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsArray } from 'class-validator';
import { IsPassword, ISAccount } from 'src/common/common/validatie-dto.decorator';

export default class CreateUserDto{
    @ISAccount()
    account: string;

    @IsNotEmpty({ message: '用户昵称不能为空' })
    @IsString({ message: '用户昵称必须是字符串' })
    name: string;

    @IsNotEmpty({ message: '用户邮箱不能为空' })
    @IsEmail({}, { message: '用户邮箱格式错误' })
    email: string;

    @IsNotEmpty({ message: '用户性别不能为空' })
    @IsIn(['0', '1', '2'], { message: '用户性别必须是 0 或 1 或 2' })
    sex: string;

    @IsPassword()
    password: string;

    @IsNotEmpty({ message: '部门 ID 不能为空' })
    @IsString({ message: '部门 ID 必须是字符串' })
    deptPublicId: string;

    @IsNotEmpty({ message: '用户头像不能为空' })
    @IsString({ message: '用户头像必须是字符串' })
    avatar: string;

    @IsArray({ message: '用户角色必须是数组' })
    @IsString({ each: true, message: '用户角色必须是字符串' })
    rolePublicIds: string[];
}