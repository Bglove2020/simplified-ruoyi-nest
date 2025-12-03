import {
  Module,
  MiddlewareConsumer,
  NestModule,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RbacGuard } from './auth/guards/rbac.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import loggingConfig from './config/logging.config';
import { AuthModule } from '@/auth/auth.module';
import { AlsModule } from './common/als/als.module';
import { LoggingModule } from './common/logging/logging.module';
import { LoggingService } from './common/logging/logging.service';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
// import { SqlExceptionFilter } from './common/filters/sql-exception.filter';
import { DeptModule } from './system/dept/dept.module';
import { MenuModule } from './system/menu/menu.module';
import { TypeOrmLoggerService } from './common/typeorm/typeorm-logger.service';
import { RoleModule } from './system/role/role.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { DatabaseSeedService } from './common/database/database.seed.service';
import { SysUser } from './system/user/entities/user.entity';
import { SysRole } from './system/role/entities/role.entity';
import { SysDept } from './system/dept/entities/dept.entity';
import { SysMenu } from './system/menu/entities/menu.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      // 这里根据 NODE_ENV 加载不同的环境变量文件，再默认加载 .env。如果不同文件中有同名变量，会保留优先加载的文件中的值，不会被后面的文件覆盖。
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [databaseConfig, loggingConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      // 关键：注入 ConfigService 和 LoggingService 供 useFactory 使用
      imports: [ConfigModule, LoggingModule],
      useFactory: (
        configService: ConfigService,
        loggingService: LoggingService,
      ) => {
        // 根据环境变量决定是否启用 SQL 日志
        const enableSqlLogging = process.env.ENABLE_SQL_LOGGING !== 'false';

        // 慢查询阈值（毫秒），超过此时间的查询会被记录为慢查询
        // 可以通过环境变量 MAX_QUERY_EXECUTION_TIME 配置，默认 1000ms（1秒）
        const maxQueryExecutionTime = parseInt(
          process.env.MAX_QUERY_EXECUTION_TIME || '1000',
          10,
        );

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
          // 使用自定义 logger 替代简单的 logging: true
          // 这样 SQL 日志会通过项目的日志系统记录，而不是直接 console.log
          logging: enableSqlLogging,
          logger: enableSqlLogging
            ? new TypeOrmLoggerService(loggingService)
            : undefined,
          // 慢查询阈值：查询执行时间超过此值（毫秒）时，会触发 logQuerySlow 方法
          // TypeORM 会自动测量查询执行时间，如果超过此阈值，会自动调用 logger.logQuerySlow()
          maxQueryExecutionTime: enableSqlLogging
            ? maxQueryExecutionTime
            : undefined,
          synchronize: true, // 建议仅在开发环境开启
          // dropSchema: true, // 建议仅在开发环境开启
        };
      },
      // 注入 ConfigService 和 LoggingService 才能在 useFactory 中使用
      inject: [ConfigService, LoggingService],
    }),
    // 注册实体以便DatabaseSeedService使用
    TypeOrmModule.forFeature([SysUser, SysRole, SysDept, SysMenu]),
    AuthModule,
    AlsModule,
    LoggingModule,
    DeptModule,
    MenuModule,
    RoleModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    RequestContextMiddleware,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    DatabaseSeedService,
  ],
})
export class AppModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly seedService: DatabaseSeedService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }

  /**
   * 应用完全启动后执行数据库种子数据初始化
   *
   * 说明：
   * - onApplicationBootstrap 在所有模块初始化完成、应用完全启动后调用
   * - TypeORM 的 forRootAsync 是异步的，NestJS 会等待其完成后再调用此钩子
   * - 因此此时 DataSource 应该已经初始化，数据库连接已经建立
   * - 如果使用 synchronize: true，表结构同步也在连接建立时完成
   *
   * 如果遇到连接未初始化的情况（理论上不应该发生），会抛出错误以便排查问题
   */
  async onApplicationBootstrap() {
    // 执行种子数据初始化
    await this.seedService.seed();
  }
}
