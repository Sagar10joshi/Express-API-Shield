import type { RequestHandler } from 'express';
import { FailFn } from '../utils/error';

const MAX_DEPTH = 10;
const MAX_QUERY_LENGTH = 2048;

function getDepth(obj: any, depth = 0): number {
  if (!obj || typeof obj !== 'object') return depth;

  let max = depth;

  for (const key in obj) {
    max = Math.max(max, getDepth(obj[key], depth + 1));
  }

  return max;
}

export function createRequestGuard(fail: FailFn): RequestHandler {
  return (req, res, next) => {
    // 1. Query length protection
    if (req.url && req.url.length > MAX_QUERY_LENGTH) {
      return fail(req, res, 'URL_TOO_LONG', 'Request URL too large');
    }

    // 2. Deep JSON protection
    if (req.body && getDepth(req.body) > MAX_DEPTH) {
      return fail(req, res, 'SUSPICIOUS_REQUEST', 'Payload nesting too deep');
    }

    next();
  };
}