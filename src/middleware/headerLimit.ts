import type { RequestHandler } from 'express';
import type { FailFn } from '../utils/error';

export function createHeaderLimitMiddleware(
  maxHeaders: number = 100,
  fail: FailFn
): RequestHandler {
  return (req, res, next) => {
    const headerCount =
  req.rawHeaders ? req.rawHeaders.length / 2 : Object.keys(req.headers || {}).length;

    if (headerCount > maxHeaders) {
  return fail(req, res, 'SUSPICIOUS_REQUEST', 'Too many headers (header flood detected)');
}

    next();
  };
}