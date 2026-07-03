import type { RequestHandler } from 'express';
import type { CorsConfig } from '../types';

/**
 * Deliberately minimal - full CORS semantics (preflight caching, exposed
 * headers, per-route origin logic) are well served by the `cors` package.
 * This covers the common case so most users don't need a second dependency;
 * README recommends swapping to `cors` directly for advanced needs.
 */
export function createCorsMiddleware(config: CorsConfig): RequestHandler {
  const methods = config.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

  return function cors(req, res, next) {
    const origin = req.headers.origin;
    let allowOrigin: string | undefined;

    if (config.origin === true) allowOrigin = origin ?? '*';
    else if (config.origin === false) allowOrigin = undefined;
    else if (typeof config.origin === 'string') allowOrigin = config.origin;
    else if (Array.isArray(config.origin)) {
      allowOrigin = origin && config.origin.includes(origin) ? origin : undefined;
    } else if (typeof config.origin === 'function') {
      allowOrigin = config.origin(origin) ? origin : undefined;
    }

    if (allowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowOrigin);
      if (config.credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}
