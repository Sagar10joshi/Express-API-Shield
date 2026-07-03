import type { Request, RequestHandler } from 'express';
import type { FailFn } from '../utils/error';

type Rule = string | RegExp | ((ua: string, req: Request) => boolean);

export function createUserAgentBlockMiddleware(rules: Rule[], fail: FailFn): RequestHandler {
  return function userAgentBlock(req, res, next) {
    const ua = req.headers['user-agent'] ?? '';

    for (const rule of rules) {
      let blocked = false;
      if (typeof rule === 'string') {
        blocked = ua.toLowerCase().includes(rule.toLowerCase());
      } else if (rule instanceof RegExp) {
        blocked = rule.test(ua);
      } else if (typeof rule === 'function') {
        blocked = rule(ua, req);
      }
      if (blocked) {
        return fail(req, res, 'USER_AGENT_BLOCKED', `User-Agent "${ua}" matched a blocked pattern`);
      }
    }
    next();
  };
}
