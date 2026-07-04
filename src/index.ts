import type { RequestHandler } from 'express';
import type { ApiShieldConfig } from './types';
import { buildShieldMiddleware } from './core/pipeline';

export type {
  ApiShieldConfig,
  ShieldErrorBody,
  ShieldErrorCode,
  ShieldContext,
  ShieldHooks,
  ShieldLogger,
  ShieldPlugin,
  AuditEvent,
} from './types';

function apiShield(config: ApiShieldConfig = {}): RequestHandler {
  return buildShieldMiddleware(config);
}

apiShield.production = (overrides: ApiShieldConfig = {}): RequestHandler =>
  buildShieldMiddleware({ preset: 'production', ...overrides });

apiShield.strict = (overrides: ApiShieldConfig = {}): RequestHandler =>
  buildShieldMiddleware({ preset: 'strict', ...overrides });

apiShield.development = (overrides: ApiShieldConfig = {}): RequestHandler =>
  buildShieldMiddleware({ preset: 'development', ...overrides });

export default apiShield;
export { apiShield, apiShield as shield };
