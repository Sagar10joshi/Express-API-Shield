import type { RequestHandler } from 'express';
import type { SanitizeConfig } from '../types';
import type { FailFn } from '../utils/error';

const DEFAULT_DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
const MAX_DEPTH = 6;


function getDepth(obj: any, depth = 0): number {
  if (!obj || typeof obj !== 'object') return depth;

  let max = depth;

  for (const key of Object.keys(obj)) {
    const d = getDepth(obj[key], depth + 1);
    if (d > max) max = d;
  }

  return max;
}



/** Mutates in place (no deep clone, per the perf goals) and drops dangerous keys. */
function stripKeys(value: unknown, dangerousKeys: string[], depth = 0): void {
  if (depth > MAX_DEPTH || value == null || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) stripKeys(item, dangerousKeys, depth + 1);
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (dangerousKeys.includes(key)) {
      delete obj[key];
      continue;
    }
    stripKeys(obj[key], dangerousKeys, depth + 1);
  }
}



export function createSanitizeMiddleware(
  config: SanitizeConfig,
  fail: FailFn
): RequestHandler {
  const dangerousKeys = config.removeKeys ?? DEFAULT_DANGEROUS_KEYS;

  return function sanitize(req, res, next) {

    // Reject excessively deep objects
    if (req.body && getDepth(req.body) > MAX_DEPTH) {
  return fail(
    req,
    res,
    "SUSPICIOUS_REQUEST",
    "Request body nesting exceeds maximum depth"
  );
}

    if (req.body) stripKeys(req.body, dangerousKeys);
    if (req.query) stripKeys(req.query, dangerousKeys);
    if (req.params) stripKeys(req.params, dangerousKeys);

    next();
  };
}
