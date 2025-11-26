import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import {AuthModule} from '@/auth/auth.module';  
import { AlsModule } from './common/als/als.module';
import { LoggingModule } from './common/logging/logging.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { SqlExceptionFilter } from './common/filters/sql-exception.filter';
import { DeptModule } from './system/dept/dept.module';
import { MenuModule } from './system/menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // 这里根据 NODE_ENV 加载不同的环境变量文件，再默认加载 .env。如果不同文件中有同名变量，会保留优先加载的文件中的值，不会被后面的文件覆盖。
      envFilePath: [`.env.${process.env.NODE_ENV}`,'.env'],
      load: [databaseConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      // 关键：注入 ConfigService 供 useFactory 使用
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          // 这里使用 configService.get() 动态获取环境变量或自定义配置的值
          // 传入泛型来明确告诉TS返回值的类型，否则TS会默认推断为所有可能类型的联合类型
          type: configService.get<any>('database.type'),
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          entities: [__dirname + '/system/**/entities/*.entity{.ts,.js}'],
          logging: true,
          synchronize: true, // 建议仅在开发环境开启
          // dropSchema: true, // 建议仅在开发环境开启
        };
      },
      // 注入 ConfigService 才能在 useFactory 中使用
      inject: [ConfigService], 
    }),
    AuthModule,
    AlsModule,
    LoggingModule,
    DeptModule,
    MenuModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    RequestContextMiddleware,
    { provide: APP_FILTER, useClass: SqlExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
