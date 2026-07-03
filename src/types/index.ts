import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Every structured error the shield can produce shares this shape. */
export interface ShieldErrorBody {
  success: false;
  code: ShieldErrorCode;
  reason: string;
  requestId: string;
  timestamp: string;
  documentation: string;
}

export type ShieldErrorCode =
  | 'IP_BLOCKED'
  | 'IP_NOT_ALLOWED'
  | 'USER_AGENT_BLOCKED'
  | 'API_KEY_MISSING'
  | 'URL_TOO_LONG'
  | 'SUSPICIOUS_REQUEST'
  | 'API_KEY_INVALID'
  | 'BODY_TOO_LARGE'
  | 'SUSPICIOUS_REQUEST'
  | 'RATE_LIMITED'
  | 'CONFIG_ERROR'
  | 'INTERNAL_ERROR';

/** Per-request state the pipeline attaches to `req.shield`. */
export interface ShieldContext {
  id: string;
  ip: string;
  fingerprint?: string;
  startTime: number;
  apiKey?: {
    valid: boolean;
    key?: string;
  };
  suspicious?: string[];
}

declare module 'express-serve-static-core' {
  interface Request {
    shield: ShieldContext;
    /** convenience alias matching the spec: req.id */
    id: string;
  }
}

export interface AuditEvent {
  event: 'blocked' | 'allowed' | 'error';
  code?: ShieldErrorCode;
  reason?: string;
  ip: string;
  path: string;
  method: string;
  requestId: string;
  timestamp: string;
}

export interface ShieldLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface ShieldHooks {
  onBlocked?: (event: AuditEvent, req: Request, res: Response) => void;
  onRequest?: (req: Request, res: Response) => void;
  onResponse?: (req: Request, res: Response) => void;
  onError?: (err: Error, req: Request, res: Response) => void;
}

export interface RequestIdConfig {
  enabled?: boolean;
  header?: string;
  generator?: (req: Request) => string;
}

export interface ApiKeyConfig {
  enabled?: boolean;
  header?: string;
  keys?: string[];
  /** Async validator for dynamic keys (DB-backed, etc). Overrides `keys` if provided. */
  validate?: (key: string, req: Request) => boolean | Promise<boolean>;
  ignore?: string[];
}

export interface SecurityHeadersConfig {
  enabled?: boolean;
  contentSecurityPolicy?: boolean | Record<string, unknown>;
  hsts?: boolean | Record<string, unknown>;
  frameguard?: boolean | Record<string, unknown>;
  noSniff?: boolean;
  referrerPolicy?: boolean | string;
  [key: string]: unknown;
}

export interface BodyLimitConfig {
  enabled?: boolean;
  json?: string;
  urlencoded?: string;
}

export interface UserAgentBlockConfig {
  enabled?: boolean;
  block?: Array<string | RegExp | ((ua: string, req: Request) => boolean)>;
}

export interface IpListConfig {
  enabled?: boolean;
  list?: string[];
}

export interface SuspiciousRequestConfig {
  enabled?: boolean;
  checks?: Array<
    'sql' | 'nosql' | 'xss' | 'commandInjection' | 'pathTraversal' | 'templateInjection' | 'prototypePollution'
  >;
  inspect?: Array<'query' | 'params' | 'body' | 'headers'>;
  action?: 'block' | 'log';
}

// export interface SanitizeConfig {
//   enabled?: boolean;
//   removeKeys?: string[];
// }

export interface SanitizeConfig {
  enabled?: boolean;
  removeKeys?: string[];
  maxDepth?: number;
}

export interface RateLimitConfig {
  enabled?: boolean;
  windowMs?: number;
  max?: number;
  ignore?: string[];
}

export interface TrustedProxyConfig {
  enabled?: boolean;
  trust?: boolean | string | string[] | number;
}

export interface CorsConfig {
  enabled?: boolean;
  origin?: string | string[] | boolean | ((origin: string | undefined) => boolean);
  methods?: string[];
  credentials?: boolean;
}

export interface ShieldPlugin {
  name: string;
  setup: (ctx: PluginContext) => RequestHandler | void;
}

export interface PluginContext {
  config: ApiShieldConfig;
  fail: (req: Request, res: Response, code: ShieldErrorCode, reason: string) => void;
  logger: ShieldLogger;
}

export interface ApiShieldConfig {
  preset?: 'production' | 'strict' | 'development' | 'custom';

  requestId?: boolean | RequestIdConfig;
  apiKey?: ApiKeyConfig;
  securityHeaders?: boolean | SecurityHeadersConfig;
  bodyLimit?: string | BodyLimitConfig;
  sanitize?: boolean | SanitizeConfig;
  suspiciousRequests?: boolean | SuspiciousRequestConfig;
  ipAllowlist?: string[] | IpListConfig;
  ipBlocklist?: string[] | IpListConfig;
  blockUserAgents?: Array<string | RegExp> | UserAgentBlockConfig;
  trustedProxies?: boolean | TrustedProxyConfig;
  rateLimit?: boolean | RateLimitConfig;
  cors?: boolean | CorsConfig;
  fingerprint?: boolean;

  ignore?: string[];
  logging?: boolean | ShieldLogger;
  hooks?: ShieldHooks;
  plugins?: ShieldPlugin[];
  documentationUrl?: string;

  queryProtection?: boolean | {
    maxLength?: number;
  };

  deepPayloadProtection?: boolean | {
    maxDepth?: number;
  };
}

export type NormalizedHandler = RequestHandler;
export type { Request, Response, NextFunction, RequestHandler };
