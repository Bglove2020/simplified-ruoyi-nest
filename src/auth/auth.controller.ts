import { Body, Controller, Post, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import CreateUserDto from '@/system/user/dto/create-user.dto';
import { LoggingService } from '@/common/logging/logging.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggingService: LoggingService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    this.loggingService.log('POST /auth/register', {
      requestDescriptor: { data: createUserDto },
    });
    await this.authService.register(createUserDto);
    this.loggingService.log('POST /auth/register success');
    return { code: 200, msg: '注册成功', data: null };
  }

  @Public()
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    this.loggingService.log('POST /auth/login', {
      requestDescriptor: {
        data: loginDto,
        ip: req.ip,
      },
    });
    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    res.cookie('refresh_token', `Bearer ${refreshToken}`, {
      httpOnly: true,
      path: 'api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    });
    this.loggingService.log('POST /auth/login success', {
      responseDescriptor: { data: { accessToken } },
    });
    return { code: 200, msg: '登录成功', data: { accessToken } };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token']?.replace('Bearer ', '');
    this.loggingService.log('POST /auth/refresh', {
      requestDescriptor: { data: { refreshToken } },
    });
    const result = await this.authService.refresh(refreshToken);
    this.loggingService.log('POST /auth/refresh success', {
      responseDescriptor: { data: result },
    });
    return { code: 200, msg: '刷新令牌成功', data: result };
  }
}
