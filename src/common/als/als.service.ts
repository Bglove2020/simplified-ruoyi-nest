import { Inject, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ALS, RequestContext } from './als.constants';

@Injectable()
export class AlsService {
  constructor(@Inject(ALS) private readonly als: AsyncLocalStorage<RequestContext>) {}

  run(context: RequestContext, callback: () => void) {
    this.als.run(context, callback);
  }

  getStore(): RequestContext | undefined {
    return this.als.getStore();
  }

  getRequestId(): string | undefined {
    return this.als.getStore()?.requestId;
  }
}