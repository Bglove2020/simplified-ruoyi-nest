import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export function IsPassword() {
  return applyDecorators(
    IsNotEmpty({ message: '密码不能为空' }),
    IsString({ message: '密码必须是字符串' }),
    MinLength(8, { message: '密码长度不能小于8位' }),
    Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message: '密码需同时包含数字、字母和特殊符号',
    }),
  );
}

export function ISAccount() {
  return applyDecorators(
    IsNotEmpty({ message: '账号不能为空' }),
    IsString({ message: '账号必须是字符串' }),
    MinLength(6, { message: '账号长度不能小于6位' }),
  );
}