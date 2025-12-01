import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '@/system/user/user.service';
import { LoginDto } from './dto/login.dto';
import CreateUserDto from '@/system/user/dto/create-user.dto';
import { LoggingService } from '@/common/logging/logging.service';
import { AlsService } from '@/common/als/als.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject('ACCESS_JWT') private readonly accessJwtService: JwtService,
    @Inject('REFRESH_JWT') private readonly refreshJwtService: JwtService,
    private readonly loggingService: LoggingService,
    private readonly alsService: AlsService,
  ) {}

  // 注册用户
  async register(createUserDto: CreateUserDto){
    const newUser = await this.userService.create(createUserDto);
    return newUser;
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
    const payload = { username: user.account, sub: user.publicId }; 
    
    // 登录成功后也更新一下上下文，方便后续日志（虽然 login 接口通常没有 userId）
    this.alsService.updateContext({ userPublicId: user.publicId });

    return {
      access_token: await this.accessJwtService.signAsync(payload),
      refresh_token: await this.refreshJwtService.signAsync(payload),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.refreshJwtService.verifyAsync(refreshToken);
      // 验证成功后更新上下文，这样后续的日志就会带上 userId
      if (payload.sub) {
        this.alsService.updateContext({ userPublicId: payload.sub });
      }
      const newAccessToken = await this.accessJwtService.signAsync({ username: payload.username, sub: payload.sub });
      return { access_token: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

}