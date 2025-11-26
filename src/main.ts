import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173','http://127.0.0.1:5173','http://192.168.0.109:5173'], // 必须是精确来源
    credentials: true,
});
  // 挂载 cookie-parser 中间件，这个中间件会自动将请求头中的 Cookie 解析为一个对象，并将其挂载到 req.cookies 属性上。
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
