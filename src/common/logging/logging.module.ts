import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingService } from './logging.service';
import loggingConfig from '../../config/logging.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(loggingConfig),
  ],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}