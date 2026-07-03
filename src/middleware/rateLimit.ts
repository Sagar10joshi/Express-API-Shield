import { rateLimit } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { RateLimitConfig } from '../types';
import type { FailFn } from '../utils/error';
import { isIgnored } from '../utils/match';

export function createRateLimitMiddleware(config: RateLimitConfig, fail: FailFn): RequestHandler {
  const ignore = config.ignore ?? [];

  return rateLimit({
    windowMs: config.windowMs ?? 60_000,
    max: config.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isIgnored(req.path, ignore),
    keyGenerator: (req) => req.shield?.ip ?? req.ip ?? 'unknown',
    handler: (req, res) => {
      fail(req, res, 'RATE_LIMITED', 'Too many requests - rate limit exceeded');
    },
  });
}
