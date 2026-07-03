import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type {
  ApiShieldConfig,
  IpListConfig,
  UserAgentBlockConfig,
} from '../types';
import { applyPreset, validateConfig } from './config';
import { resolveLogger } from '../utils/logger';
import { createFail } from '../utils/error';
import { isIgnored } from '../utils/match';

import { createRequestIdMiddleware } from '../middleware/requestId';
import { createIpResolverMiddleware } from '../middleware/trustedProxy';
import { createIpBlocklistMiddleware, createIpAllowlistMiddleware } from '../middleware/ipFilter';
import { createUserAgentBlockMiddleware } from '../middleware/userAgent';
import { createBodyLimitMiddleware } from '../middleware/bodyLimit';
import { createApiKeyMiddleware } from '../middleware/apiKey';
import { createSanitizeMiddleware } from '../middleware/sanitize';
import { createSuspiciousRequestMiddleware } from '../middleware/suspicious';
import { createSecurityHeadersMiddleware } from '../middleware/securityHeaders';
import { createCorsMiddleware } from '../middleware/cors';
import { createRateLimitMiddleware } from '../middleware/rateLimit';
import { createQueryLimitMiddleware } from '../middleware/queryLimit';
import { createHeaderLimitMiddleware } from '../middleware/headerLimit';

function toListConfig(value: string[] | IpListConfig | undefined): { enabled: boolean; list: string[] } {
  if (!value) return { enabled: false, list: [] };
  if (Array.isArray(value)) return { enabled: value.length > 0, list: value };
  return { enabled: value.enabled ?? (value.list?.length ?? 0) > 0, list: value.list ?? [] };
}

function toUaConfig(value: Array<string | RegExp> | UserAgentBlockConfig | undefined) {
  if (!value) return { enabled: false, block: [] as Array<string | RegExp | ((ua: string, req: Request) => boolean)> };
  if (Array.isArray(value)) return { enabled: value.length > 0, block: value };
  return { enabled: value.enabled ?? (value.block?.length ?? 0) > 0, block: value.block ?? [] };
}

export function buildShieldMiddleware(rawConfig: ApiShieldConfig): RequestHandler {
  const config = applyPreset(rawConfig);
  const logger = resolveLogger(config.logging);

  const issues = validateConfig(config);
  for (const issue of issues) {
    logger.warn(`[shield] config warning (${issue.path}): ${issue.message}`);
  }

  const documentationUrl = config.documentationUrl ?? 'https://github.com/your-org/express-api-shield/blob/main/docs/errors.md';
  const hooks = config.hooks ?? {};
  const fail = createFail({ logger, hooks, documentationUrl });
  const globalIgnore = config.ignore ?? [];

  const stages: RequestHandler[] = [];

  // 1. Request ID - always runs (even if `requestId: false`, we still want an id
  //    internally for logging/errors); the flag only controls the response header/generator override.
  const ridConfig = typeof config.requestId === 'object' ? config.requestId : {};
  stages.push(createRequestIdMiddleware(ridConfig));

  // 2. Trusted proxy / IP resolution - needed by almost every later stage.
  const proxyConfig = typeof config.trustedProxies === 'object' ? config.trustedProxies : { enabled: !!config.trustedProxies };
  stages.push(createIpResolverMiddleware(proxyConfig, !!config.fingerprint));

  // 3. IP blocklist / allowlist
  const blocklist = toListConfig(config.ipBlocklist);
  if (blocklist.enabled) stages.push(createIpBlocklistMiddleware(blocklist.list, fail));
  const allowlist = toListConfig(config.ipAllowlist);
  if (allowlist.enabled) stages.push(createIpAllowlistMiddleware(allowlist.list, fail));

  // 4. User-agent blocking
  const ua = toUaConfig(config.blockUserAgents);
  if (ua.enabled) stages.push(createUserAgentBlockMiddleware(ua.block, fail));

  // 5. CORS (must run before auth so preflight OPTIONS doesn't get 401'd)
  if (config.cors) {
    const corsConfig = typeof config.cors === 'object' ? config.cors : {};
    stages.push(createCorsMiddleware(corsConfig));
  }

  // 6. Rate limiting
  if (config.rateLimit) {
    const rlConfig = typeof config.rateLimit === 'object' ? config.rateLimit : {};
    stages.push(createRateLimitMiddleware(rlConfig, fail));
  }

  // 7. Body size limits (parses body - required before apiKey/suspicious can inspect it)
  if (config.bodyLimit) {
    const blConfig = typeof config.bodyLimit === 'string' ? { json: config.bodyLimit } : config.bodyLimit;
    stages.push(createBodyLimitMiddleware(blConfig, fail));
  }

  if (config.deepPayloadProtection) {
    const maxDepth =
      typeof config.deepPayloadProtection === 'object'
        ? config.deepPayloadProtection.maxDepth ?? 6
        : 6;

    stages.push(createHeaderLimitMiddleware(100, fail));
  }

  if (config.queryProtection) {
    const maxLength =
      typeof config.queryProtection === 'object'
        ? config.queryProtection.maxLength ?? 2000
        : 2000;

    stages.push(createQueryLimitMiddleware(maxLength, fail));
  }



  // 8. API key auth
  if (config.apiKey?.enabled) {
    stages.push(createApiKeyMiddleware(config.apiKey, fail));
  }

  // 9. Sanitize (before suspicious-request scanning so stripped keys don't false-positive)
  if (config.sanitize) {
    const sanConfig = typeof config.sanitize === 'object' ? config.sanitize : {};
    stages.push(createSanitizeMiddleware(sanConfig, fail));
  }

  // 10. Suspicious request detection
  if (config.suspiciousRequests) {
    const srConfig = typeof config.suspiciousRequests === 'object' ? config.suspiciousRequests : {};
    stages.push(createSuspiciousRequestMiddleware(srConfig, fail));
  }

  // MUST run when suspiciousRequests is enabled
  if (config.suspiciousRequests) {
    stages.push(createQueryLimitMiddleware(2000, fail));
    stages.push(createHeaderLimitMiddleware(100, fail));
  }


  // 11. Security headers (helmet) - set as early as possible in terms of the
  //     HTTP response, but ordered last here so it doesn't run for requests
  //     already rejected above, saving the (small) helmet overhead.
  if (config.securityHeaders) {
    const shConfig = typeof config.securityHeaders === 'object' ? config.securityHeaders : {};
    stages.push(createSecurityHeadersMiddleware(shConfig));
  }

  // 12. Plugins - run last, after all built-in checks, and receive the same `fail` helper.
  for (const plugin of config.plugins ?? []) {
    const handler = plugin.setup({ config, fail, logger });
    if (handler) stages.push(handler);
  }

  return function apiShieldPipeline(req: Request, res: Response, next: NextFunction) {
    if (isIgnored(req.path, globalIgnore)) return next();

    hooks.onRequest?.(req, res);
    if (hooks.onResponse) {
      res.on('finish', () => hooks.onResponse?.(req, res));
    }

    let index = 0;
    function runStage(err?: unknown) {
      if (err) return next(err);
      const stage = stages[index++];
      if (!stage) return next();
      try {
        stage(req, res, runStage);
      } catch (stageErr) {
        try {
          hooks.onError?.(stageErr as Error, req, res);
        } catch {
          /* swallow secondary hook error */
        }
        next(stageErr);
      }
    }
    runStage();
  };
}
