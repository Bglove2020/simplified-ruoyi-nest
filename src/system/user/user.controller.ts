import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import CreateUserDto from './dto/create-user.dto';
import ResetUserPasswordDto from './dto/reset-user-password.dto';
import UpdateUserDto from './dto/update-user.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { Public } from '@/auth/public.decorator';
import { RequirePerms } from '@/auth/decorators/perms.decorator';
import FrontendUserDto from './dto/frontend-user.dto';
import { toFrontendDto, toFrontendListDtos } from './mapper/user.mapper';

@Controller('/system/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly loggingService: LoggingService,
  ) {}

  @RequirePerms('system:user:list')
  @Get('list')
  async list(): Promise<{
    code: number;
    msg: string;
    data: FrontendUserDto[];
  }> {
    this.loggingService.log('GET /system/user/list');
    const users = await this.userService.list();
    this.loggingService.log('GET /system/user/list success', {
      responseDescriptor: { type: 'list', count: users.length },
    });
    return {
      code: 200,
      msg: '用户列表获取成功',
      data: toFrontendListDtos(users),
    };
  }

  @RequirePerms('system:user:add')
  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    this.loggingService.log('POST /system/user/create', {
      requestDescriptor: { data: createUserDto },
    });
    await this.userService.create(createUserDto);
    this.loggingService.log('POST /system/user/create success');
    return { code: 200, msg: '用户创建成功', data: null };
  }

  @RequirePerms('system:user:query')
  @Get('get/:publicId')
  async get(@Param('publicId') publicId: string) {
    this.loggingService.log('GET /system/user/get', {
      params: { publicId: publicId },
    });
    const user = await this.userService.get(publicId);
    if (user) {
      this.loggingService.log('GET /system/user/get success', {
        responseDescriptor: { data: toFrontendDto(user) },
      });
      return { code: 200, msg: '用户获取成功', data: toFrontendDto(user) };
    } else {
      this.loggingService.log('GET /system/user/get failed', {
        responseDescriptor: { data: null },
      });
      return { code: 404, msg: '用户不存在', data: null };
    }
  }

  @Public()
  @Get('checkUserAccount')
  async getByAccount(@Query('account') account: string) {
    this.loggingService.log('GET /system/user/checkUserAccount', {
      query: { account: account },
    });
    const user = await this.userService.getByAccount(account);
    if (user) {
      this.loggingService.log('GET /system/user/checkUserAccount success', {
        responseDescriptor: { data: { available: false, msg: '账号已存在' } },
      });
      return { code: 200, msg: '账号已存在', data: { available: false } };
    }
    this.loggingService.log('GET /system/user/checkUserAccount success', {
      responseDescriptor: { data: { available: true, msg: '账号可用' } },
    });
    return { code: 200, msg: '账号可用', data: { available: true } };
  }

  @RequirePerms('system:user:resetPwd')
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetUserPasswordDto) {
    this.loggingService.log('POST /system/user/resetPassword', {
      requestDescriptor: { data: resetPasswordDto },
    });
    await this.userService.resetPassword(resetPasswordDto);
    this.loggingService.log('POST /system/user/resetPassword success');
    return { code: 200, msg: '密码重置成功', data: null };
  }

  @RequirePerms('system:user:edit')
  @Post('update')
  async update(@Body() updateUserDto: UpdateUserDto) {
    this.loggingService.log('POST /system/user/update', {
      requestDescriptor: { data: updateUserDto },
    });
    await this.userService.update(updateUserDto);
    this.loggingService.log('POST /system/user/update success');
    return { code: 200, msg: '用户更新成功', data: null };
  }

  @RequirePerms('system:user:remove')
  @Delete('delete/:publicId')
  async delete(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/user/delete', {
      params: { publicId: publicId },
    });
    await this.userService.delete(publicId);
    this.loggingService.log('DELETE /system/user/delete success');
    return { code: 200, msg: '用户删除成功', data: null };
  }
}
