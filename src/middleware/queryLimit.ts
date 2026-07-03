import type { RequestHandler } from 'express';
import type { FailFn } from '../utils/error';

export function createQueryLimitMiddleware(
  maxLength: number = 2000,
  fail: FailFn
): RequestHandler {
  return (req, res, next) => {
    const query = req.url.split('?')[1] || '';
    const length = query.length;

if (length > maxLength) {
//   console.log("QUERY LIMIT HIT");

  return fail(
    req,
    res,
    "SUSPICIOUS_REQUEST",
    "Query string too long (possible DoS attempt)"
  );
}
    next();
  };
}