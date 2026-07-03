import type { ApiShieldConfig } from '../types';

/**
 * Presets are plain partial configs merged *underneath* whatever the user
 * explicitly sets - so `apiShield({ preset: 'production', bodyLimit: '5mb' })`
 * keeps every production default except bodyLimit. This keeps preset logic
 * as data, not branching code, which makes it trivial to test and to add a
 * 4th preset later.
 */
const PRESETS: Record<'production' | 'strict' | 'development', ApiShieldConfig> = {
  development: {
    requestId: true,
    securityHeaders: { contentSecurityPolicy: false }, // CSP is disruptive during local dev
    bodyLimit: '5mb',
    sanitize: true,
    suspiciousRequests: { action: 'log' },
    trustedProxies: false,
    rateLimit: false,
    logging: true,
  },
  production: {
    requestId: true,
    securityHeaders: true,
    bodyLimit: '1mb',
    sanitize: true,
    suspiciousRequests: { action: 'block' },
    trustedProxies: true,
    rateLimit: { windowMs: 60_000, max: 300 },
    logging: true,
  },
  strict: {
    requestId: true,
    securityHeaders: true,
    bodyLimit: '256kb',
    sanitize: true,
    suspiciousRequests: { action: 'block' },
    trustedProxies: true,
    rateLimit: { windowMs: 60_000, max: 60 },
    logging: true,
  },
};

export function applyPreset(config: ApiShieldConfig): ApiShieldConfig {
  const presetName = config.preset;
  if (!presetName || presetName === 'custom') return config;

  const preset = PRESETS[presetName];
  if (!preset) return config;

  // Shallow merge is intentional: any top-level key the user set (even an
  // empty object) fully overrides the preset's value for that key, rather
  // than deep-merging nested option objects, which would surprise users.
  return { ...preset, ...config };
}

export interface ConfigValidationIssue {
  path: string;
  message: string;
}

/** Best-effort config validation - warns rather than throws for most issues, but throws for genuinely broken configs (e.g. apiKey enabled with zero keys and no validator). */
export function validateConfig(config: ApiShieldConfig): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (config.apiKey?.enabled) {
    const hasKeys = Array.isArray(config.apiKey.keys) && config.apiKey.keys.length > 0;
    const hasValidator = typeof config.apiKey.validate === 'function';
    if (!hasKeys && !hasValidator) {
      issues.push({
        path: 'apiKey',
        message: 'apiKey.enabled is true but no `keys` array or `validate` function was provided.',
      });
    }
  }

  if (config.ipAllowlist && config.ipBlocklist) {
    const allow = Array.isArray(config.ipAllowlist) ? config.ipAllowlist : config.ipAllowlist.list ?? [];
    const block = Array.isArray(config.ipBlocklist) ? config.ipBlocklist : config.ipBlocklist.list ?? [];
    const overlap = allow.filter((ip) => block.includes(ip));
    if (overlap.length > 0) {
      issues.push({
        path: 'ipAllowlist/ipBlocklist',
        message: `IP(s) ${overlap.join(', ')} appear in both the allowlist and blocklist. Blocklist takes precedence.`,
      });
    }
  }

  if (config.suspiciousRequests) {
    const srConfig = typeof config.suspiciousRequests === 'object' ? config.suspiciousRequests : {};
    const inspect = srConfig.inspect ?? ['query', 'params', 'body'];
    if (inspect.includes('body') && !config.bodyLimit) {
      issues.push({
        path: 'suspiciousRequests',
        message:
          "suspiciousRequests is configured to inspect 'body' but `bodyLimit` is not enabled, so req.body will not be parsed by the shield. Either enable `bodyLimit`, parse the body yourself before this middleware, or remove 'body' from `suspiciousRequests.inspect`.",
      });
    }
  }

  return issues;
}
