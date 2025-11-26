import { Global, Module } from '@nestjs/common';
import { AlsModule } from '../als/als.module';
import { LoggingService } from './logging.service'

@Global()
@Module({
  imports: [AlsModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}