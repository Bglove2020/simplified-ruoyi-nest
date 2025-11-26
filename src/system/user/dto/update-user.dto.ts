import { PartialType } from "@nestjs/mapped-types";
import CreateUserDto from "./create-user.dto";
import { IsNotEmpty, IsString } from "class-validator";

export default class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsNotEmpty({ message: '用户 ID 不能为空' })
    @IsString({ message: '用户 ID 必须是字符串' })
    publicId: string;
}