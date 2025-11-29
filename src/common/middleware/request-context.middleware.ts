import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AlsService } from '../als/als.service';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly als: AlsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const h = req.headers['x-request-id'];
    const rid = typeof h === 'string' ? h : randomUUID();
    res.setHeader('X-Request-Id', rid);
    // userId 会在 JwtAuthGuard 中通过 updateContext 设置
    this.als.run({ requestId: rid }, () => next());
  }
}