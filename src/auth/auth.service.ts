import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '@/system/user/user.service';
import { LoginDto } from './dto/login.dto';
import CreateUserDto from '@/system/user/dto/create-user.dto';
import { AlsService } from '@/common/als/als.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject('ACCESS_JWT') private readonly accessJwtService: JwtService,
    @Inject('REFRESH_JWT') private readonly refreshJwtService: JwtService,
    private readonly alsService: AlsService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
  }

  async validateUser(userAccount: string, pass: string): Promise<any> {
    const user = await this.userService.getByAccount(userAccount);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.account, loginDto.password);
    if (!user) {
      throw new BadRequestException({msg: '用户名或密码错误', code: 400});
    }
    const payload = { userAccount: user.account, sub: user.publicId };
    // 更新异步上下文，将用户publicId放入
    this.alsService.updateContext({ userPublicId: user.publicId });

    return {
      accessToken: await this.accessJwtService.signAsync(payload),
      refreshToken: await this.refreshJwtService.signAsync(payload),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.refreshJwtService.verifyAsync(refreshToken);
      if (payload.sub) {
        this.alsService.updateContext({ userPublicId: payload.sub });
      }
      const newAccessToken = await this.accessJwtService.signAsync({
        userAccount: payload.userAccount,
        sub: payload.sub,
      });
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException({msg: '刷新令牌无效', code: 401});
    }
  }
}