import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** IDs enviados por proxies (browser/BFF): UUID ou string curta segura para logs. */
const SAFE_INCOMING_ID = /^[a-zA-Z0-9-]{8,128}$/;

/**
 * Correlação de pedidos (`X-Request-Id`): repete o ID do cliente ou gera UUID.
 * Regista uma linha JSON em stdout quando a resposta termina (consumo por agregadores).
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const raw = req.headers['x-request-id'];
    const requestId =
      typeof raw === 'string' &&
      SAFE_INCOMING_ID.test(raw.trim()) &&
      raw.trim().length <= 128
        ? raw.trim().slice(0, 128)
        : randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const t0 = performance.now();
    res.on('finish', () => {
      const durationMs = Math.round(performance.now() - t0);
      console.log(
        JSON.stringify({
          level: 'info',
          msg: 'http_request',
          service: 'pronuxfin-api',
          requestId,
          method: req.method,
          path: req.originalUrl ?? req.url,
          statusCode: res.statusCode,
          durationMs,
        }),
      );
    });

    next();
  }
}
