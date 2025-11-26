import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import  CreateUserDto from '@/system/user/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  @Public()
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  async login(@Res({ passthrough: true }) res: Response,@Body() loginDto: LoginDto) {
    console.log('loginDto:', loginDto);
    const { access_token, refresh_token } = await this.authService.login(loginDto);
    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);
    res.cookie('refresh_token', `Bearer ${refresh_token}`, {
      httpOnly: true,
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
    console.log('refreshToken:', refreshToken);
    return await this.authService.refresh(refreshToken);
  }
}