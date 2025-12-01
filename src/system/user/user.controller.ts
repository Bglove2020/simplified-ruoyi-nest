import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import CreateUserDto from './dto/create-user.dto';
import ResetUserPasswordDto from './dto/reset-user-password.dto';
import UpdateUserDto from './dto/update-user.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { SysUser } from './entities/user.entity';
import { Public } from '@/auth/public.decorator';
import FrontendUserDto from './dto/frontend-user.dto';
import { agent } from 'supertest';
import{ toFrontendDto, toFrontendListDtos } from './mapper/user.mapper';

@Controller('/system/user')
export class UserController {
  constructor(
    private readonly userService: UserService, 
    private readonly loggingService: LoggingService
  ) {}

  @Get('list')
  async list(): Promise<FrontendUserDto[]>{
    // 记录查询参数
    this.loggingService.log('GET /system/user/list',{query: {name: 'list',agent: 'list'},responseDescriptor: {type: 'list',count: 0}});
    let users: SysUser[] = [];
    try{
      users = await this.userService.list(); 
    }
    catch(error){
      this.loggingService.error('GET /system/user/list error', error);
    }
    return toFrontendListDtos(users);
  }

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {

    // this.loggingService.log('create', createUserDto);
    this.loggingService.log('POST /system/user/create', {requestDescriptor: {data: createUserDto}});
    const result = await this.userService.create(createUserDto);
    if(result){
      this.loggingService.log('POST /system/user/create success', {responseDescriptor: {data: result}});
      return {success: true, msg: '用户创建成功'};
    }else{
      this.loggingService.log('POST /system/user/create failed', {responseDescriptor: {data: result}});
      return {success: false, msg: '用户创建失败'};
    }
  }

  @Get('get/:publicId')
  async get(@Param('publicId') publicId: string) {
    this.loggingService.log('GET /system/user/get', {params: {publicId: publicId}});
    let user: SysUser | null = null;
    try{
      user = await this.userService.get(publicId);
    }catch(error){
      this.loggingService.error('GET /system/user/get error', error);
    }
    if(user){
      return {success: true, msg: '用户获取成功',data: toFrontendDto(user)};
    }else{
      return {success: false, msg: '用户不存在'};
    }
  }

  @Public()
  @Get('checkUserAccount')
  async getByAccount(@Query('account') account: string) {
    this.loggingService.log('GET /system/user/checkUserAccount', {query: {account: account}});
    let user: SysUser | null = null;
    try{
      user = await this.userService.getByAccount(account);
    }catch(error){
      this.loggingService.error('GET /system/user/checkUserAccount error', error);
    }
    return user ? { available: false, msg: '账号已存在' } : { available: true, msg: '账号可用' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetUserPasswordDto) {
    return await this.userService.resetPassword(resetPasswordDto) ? { success: true,msg: '密码重置成功' } : { success: false,msg: '密码重置失败' };
  }


  @Post('update')
  async update(@Body() updateUserDto: UpdateUserDto) {
    this.loggingService.log('POST /system/user/update', {requestDescriptor: {data: updateUserDto}});
    await this.userService.update(updateUserDto);
    this.loggingService.log('POST /system/user/update success');
    return {success: true, msg: '用户更新成功'};
  }

  @Delete('delete/:publicId')
  async delete(@Param('publicId') publicId: string) {
    this.loggingService.log('DELETE /system/user/delete', {params: {publicId: publicId}});
    await this.userService.delete(publicId);
    this.loggingService.log('DELETE /system/user/delete success');
    return {success: true, msg: '用户删除成功'};
  }
}