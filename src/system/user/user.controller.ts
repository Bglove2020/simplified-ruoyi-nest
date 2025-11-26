import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UserMapper } from './mapper/user.mapper';
import CreateUserDto from './dto/create-user.dto';
import ResetUserPasswordDto from './dto/reset-user-password.dto';
import UpdateUserDto from './dto/update-user.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { SysUser } from './entities/user.entity';
import { Public } from '@/auth/public.decorator';
import FrontendUserDto from './dto/frontend-user.dto';

@Controller('/system/user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly loggingService: LoggingService) {}

  @Get('list')
  async list(): Promise<FrontendUserDto[]>{
    // 记录查询参数
    this.loggingService.log('GET /system/user/list');
    let users: SysUser[] = [];
    try{
      users = await this.userService.list(); 
      console.log('users:', users);
    }
    catch(error){
      this.loggingService.error('GET /system/user/list error', error);
    }
    return UserMapper.toFrontendListDtos(users);
  }

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {

    this.loggingService.log('create', createUserDto);
    return this.userService.create(createUserDto);
  }

  @Public()
  @Get('checkUserAccount')
  async getByAccount(@Query('account') account: string) {
    console.log(account);
    const user = await this.userService.getByAccount(account);
    console.log(user);
    return user ? { available: false, msg: '账号已存在' } : { available: true, msg: '账号可用' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetUserPasswordDto) {
    console.log(resetPasswordDto);
    return await this.userService.resetPassword(resetPasswordDto) ? { success: true,msg: '密码重置成功' } : { success: false,msg: '密码重置失败' };
  }

  @Delete('delete-by-account')
  async deleteByAccount(@Query('account') account: string) {
    return await this.userService.deleteByAccount(account);
  }

  // 批量删除用户
  @Delete('delete-by-accounts')
  async deleteByAccounts(@Query('accounts') accounts: string[]) {
    return await this.userService.deleteByAccounts(accounts);
  }

  @Post('update')
  async update(@Body() updateUserDto: UpdateUserDto) {
    if(!updateUserDto.publicId){
      return { success: false, msg: '用户不存在' };
    }
    return await this.userService.update(updateUserDto);
  }
}