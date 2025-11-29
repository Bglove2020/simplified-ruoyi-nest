import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import  CreateUserDto from '@/system/user/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '@/common/logging/logging.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, 
    private readonly loggingService: LoggingService
  ) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    this.loggingService.log(
      'POST /auth/register',
      {body: createUserDto}
    );
    try{
      const result = await this.authService.register(createUserDto);
      this.loggingService.log(
        'POST /auth/register',
        {response: result}
      );
      return result;
    } catch (error) {
      this.loggingService.error('POST /auth/register', {body: createUserDto}, {responseDescriptor: {type: 'register',count: 2}});
      throw error;
    }
  }

  @Public()
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
    @Req() req: Request
  ) {
    this.loggingService.log(
      'POST /auth/login',
      {body: loginDto,requestDescriptor: {ip: req.ip,userAgent: req.headers['user-agent']}},
      {responseDescriptor: {type: 'login',count: 0}}
    );
    const { access_token, refresh_token } = await this.authService.login(loginDto);

    res.cookie('refresh_token', `Bearer ${refresh_token}`, {
      httpOnly: true,
      // 因为使用了前端代理，所以不需要设置cookie的同站策略了
      // secure: true,
      // sameSite: this.configService.get<string>('NODE_ENV') === 'development' ? 'none' : 'strict',
      path: 'api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { access_token };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token']?.replace('Bearer ', ''); 
    this.loggingService.log(
      'POST /auth/refresh',
      {requestDescriptor: {ip: req.ip,userAgent: req.headers['user-agent']}},
      {responseDescriptor: {type: 'refresh',count: 0}}
    );
    const result = await this.authService.refresh(refreshToken);
    this.loggingService.log(
      'POST /auth/refresh',
      {requestDescriptor: {ip: req.ip,userAgent: req.headers['user-agent']}},
      {responseDescriptor: {type: 'refresh',count: 1}}
    );
    return result;
  }
}