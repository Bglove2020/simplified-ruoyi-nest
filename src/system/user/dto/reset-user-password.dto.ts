import { PartialType } from "@nestjs/mapped-types";
import CreateUserDto from "./create-user.dto";
import { IsNotEmpty, IsString} from "class-validator";
import { IsPassword } from "@/common/common/validatie-dto.decorator";

export default class ResetUserPasswordDto extends PartialType(CreateUserDto) {
    @IsNotEmpty({ message: '用户 ID 不能为空' })
    @IsString({ message: '用户 ID 必须是字符串' })
    publicId: string;

    @IsPassword()
    password: string;
}