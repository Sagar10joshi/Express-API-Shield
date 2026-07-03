import { timingSafeEqual } from 'crypto';
import type { RequestHandler } from 'express';
import type { ApiKeyConfig } from '../types';
import type { FailFn } from '../utils/error';
import { isIgnored } from '../utils/match';

/** Constant-time string comparison to avoid timing attacks on key comparison. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createApiKeyMiddleware(config: ApiKeyConfig, fail: FailFn): RequestHandler {
  const header = (config.header ?? 'x-api-key').toLowerCase();
  const keys = config.keys ?? [];
  const ignore = config.ignore ?? [];

  return async function apiKey(req, res, next) {
    if (isIgnored(req.path, ignore)) return next();

    const provided = req.headers[header];
    const key = Array.isArray(provided) ? provided[0] : provided;

    if (!key) {
      return fail(req, res, 'API_KEY_MISSING', `Missing API key in header "${config.header ?? 'x-api-key'}"`);
    }

    try {
      let valid: boolean;
      if (config.validate) {
        valid = await config.validate(key, req);
      } else {
        valid = keys.some((k) => safeEqual(k, key));
      }

      req.shield.apiKey = { valid, key: valid ? key : undefined };

      if (!valid) {
        return fail(req, res, 'API_KEY_INVALID', 'Provided API key is not valid');
      }
      next();
    } catch (err) {
      return fail(
        req,
        res,
        'API_KEY_INVALID',
        `API key validation threw an error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };
}
