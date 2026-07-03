import helmet from 'helmet';
import type { RequestHandler } from 'express';
import type { SecurityHeadersConfig } from '../types';

/**
 * Thin wrapper around helmet. We don't reimplement header logic - helmet is
 * the battle-tested choice here (per the "don't reinvent" philosophy) - but
 * we translate our flatter config shape into helmet's options and allow
 * individual headers to be toggled off with `false`.
 */
export function createSecurityHeadersMiddleware(config: SecurityHeadersConfig): RequestHandler {
  const options: Parameters<typeof helmet>[0] = {};

  if (config.contentSecurityPolicy === false) options.contentSecurityPolicy = false;
  else if (typeof config.contentSecurityPolicy === 'object') {
    options.contentSecurityPolicy = { directives: config.contentSecurityPolicy } as never;
  }

  if (config.hsts === false) options.hsts = false;
  else if (typeof config.hsts === 'object') options.hsts = config.hsts as never;

  if (config.frameguard === false) options.frameguard = false;
  else if (typeof config.frameguard === 'object') options.frameguard = config.frameguard as never;

  if (config.noSniff === false) options.noSniff = false;

  if (config.referrerPolicy === false) options.referrerPolicy = false;
  else if (typeof config.referrerPolicy === 'string') {
    options.referrerPolicy = { policy: config.referrerPolicy as never };
  }

  return helmet(options);
}
