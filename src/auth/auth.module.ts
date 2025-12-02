import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../system/user/user.module'; // 确保引入 UserModule
import { ConfigService } from '@nestjs/config';
import type ms from 'ms';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { SysUser } from '@/system/user/entities/user.entity';
import { SysMenu } from '@/system/menu/entities/menu.entity';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([SysUser, SysMenu]),
  ],
  providers: [
    AuthService,
    ProfileService,
    {
      provide: 'ACCESS_JWT',
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>('JWT_ACCESS_SECRET'),
          // 这里的泛型直接指定string还不行，需要指定ms.StringValue。ms.StringValue是ms库的类型，用于表示时间字符串。
          signOptions: { expiresIn: config.get<ms.StringValue>('JWT_ACCESS_EXPIRES_IN') ?? '2h' },
        }),
      inject: [ConfigService],
    },
    {
      provide: 'REFRESH_JWT',
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>('JWT_REFRESH_SECRET'),
          signOptions: { expiresIn: config.get<ms.StringValue>('JWT_REFRESH_EXPIRES_IN') ?? '7d' },
        }),
      inject: [ConfigService],
    }
  ],
  controllers: [AuthController, ProfileController],
  exports: [AuthService, 'ACCESS_JWT', 'REFRESH_JWT'], 
})
export class AuthModule {}
