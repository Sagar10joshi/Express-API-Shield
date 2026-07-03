import type { RequestHandler } from 'express';
import type { TrustedProxyConfig } from '../types';
import { resolveClientIp } from '../utils/ip';
import { generateFingerprint } from '../utils/id';

export function createIpResolverMiddleware(config: TrustedProxyConfig, fingerprint: boolean): RequestHandler {
  return function ipResolver(req, _res, next) {
    const ip = resolveClientIp(req, config);
    req.shield.ip = ip;
    if (fingerprint) {
      req.shield.fingerprint = generateFingerprint(req, ip);
    }
    next();
  };
}
