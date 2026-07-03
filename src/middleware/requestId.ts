import type { RequestHandler } from 'express';
import type { RequestIdConfig } from '../types';
import { defaultGenerateId } from '../utils/id';

export function createRequestIdMiddleware(config: RequestIdConfig): RequestHandler {
  const header = config.header ?? 'X-Request-ID';
  const generator = config.generator ?? defaultGenerateId;

  return function requestId(req, res, next) {
    // Respect an inbound request ID (e.g. from an upstream gateway) if present,
    // so traces stay correlated end-to-end instead of being overwritten.
    const inbound = req.headers[header.toLowerCase()];
    const id = (typeof inbound === 'string' && inbound.trim()) || generator(req);

    req.id = id;
    req.shield = req.shield ?? ({} as never);
    req.shield.id = id;
    req.shield.startTime = Date.now();

    res.setHeader(header, id);
    next();
  };
}
