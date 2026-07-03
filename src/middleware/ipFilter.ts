import type { RequestHandler } from 'express';
import type { FailFn } from '../utils/error';
import { ipMatchesList } from '../utils/ip';

/**
 * Blocklist and allowlist are separate middlewares (not one combined stage)
 * so ordering and error codes stay unambiguous, and so a plugin can insert
 * between them if needed.
 */
export function createIpBlocklistMiddleware(list: string[], fail: FailFn): RequestHandler {
  return function ipBlocklist(req, res, next) {
    if (list.length > 0 && ipMatchesList(req.shield.ip, list)) {
      return fail(req, res, 'IP_BLOCKED', `IP address ${req.shield.ip} is on the blocklist`);
    }
    next();
  };
}

export function createIpAllowlistMiddleware(list: string[], fail: FailFn): RequestHandler {
  return function ipAllowlist(req, res, next) {
    // Empty allowlist means "no restriction" - an allowlist is opt-in, unlike blocklist.
    if (list.length > 0 && !ipMatchesList(req.shield.ip, list)) {
      return fail(req, res, 'IP_NOT_ALLOWED', `IP address ${req.shield.ip} is not on the allowlist`);
    }
    next();
  };
}
