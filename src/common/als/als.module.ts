import { Global, Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { AlsService } from './als.service';
import { ALS, RequestContext } from './als.constants';

@Global()
@Module({
  providers: [
    { provide: ALS, useValue: new AsyncLocalStorage<RequestContext>() },
    AlsService,
  ],
  exports: [ALS, AlsService],
})
export class AlsModule {}