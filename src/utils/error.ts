import type { Request, Response } from 'express';
import type { AuditEvent, ShieldErrorBody, ShieldErrorCode, ShieldHooks, ShieldLogger } from '../types';

const STATUS_BY_CODE: Record<ShieldErrorCode, number> = {
  IP_BLOCKED: 403,
  IP_NOT_ALLOWED: 403,
  USER_AGENT_BLOCKED: 403,
  API_KEY_MISSING: 401,
  URL_TOO_LONG: 414,
  API_KEY_INVALID: 401,
  BODY_TOO_LARGE: 413,
  SUSPICIOUS_REQUEST: 400,
  RATE_LIMITED: 429,
  CONFIG_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export interface FailDeps {
  logger: ShieldLogger;
  hooks: ShieldHooks;
  documentationUrl: string;
}

/**
 * Single choke point for every rejection produced by the shield.
 * Ensures identical JSON shape, logging, audit trail, and hook firing
 * no matter which stage triggered the failure.
 */
export function createFail(deps: FailDeps) {
  return function fail(req: Request, res: Response, code: ShieldErrorCode, reason: string): void {
    if (res.headersSent) return;

    const requestId = req.shield?.id ?? 'unknown';
    const body: ShieldErrorBody = {
      success: false,
      code,
      reason,
      requestId,
      timestamp: new Date().toISOString(),
      documentation: `${deps.documentationUrl}#${code.toLowerCase()}`,
    };

    const event: AuditEvent = {
      event: 'blocked',
      code,
      reason,
      ip: req.shield?.ip ?? req.ip ?? 'unknown',
      path: req.path,
      method: req.method,
      requestId,
      timestamp: body.timestamp,
    };

    deps.logger.warn(`[shield] blocked ${req.method} ${req.path}: ${code} - ${reason}`, { requestId });

    try {
      deps.hooks.onBlocked?.(event, req, res);
    } catch (hookErr) {
      deps.logger.error('[shield] onBlocked hook threw', { error: String(hookErr) });
    }

    res.status(STATUS_BY_CODE[code]).json(body);
  };
}

export type FailFn = ReturnType<typeof createFail>;
