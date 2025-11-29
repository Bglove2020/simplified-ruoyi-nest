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

  // 获取 userId
  getUserPublicId(): string | undefined {
    return this.als.getStore()?.userPublicId;
  }

  // 更新上下文（直接修改 store 对象，避免 enterWith 在 async 边界的问题）
  updateContext(updates: Partial<RequestContext>): void {
    const store = this.als.getStore();
    if (store) {
      // 直接修改 store 对象的属性，而不是用 enterWith 替换
      // 这里使用enterWith不行，
      Object.assign(store, updates);
    }
  }
}