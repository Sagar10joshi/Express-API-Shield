import type { Request, RequestHandler } from 'express';
import type { SuspiciousRequestConfig } from '../types';
import type { FailFn } from '../utils/error';
import { patternsForCategories, type CompiledPattern } from '../utils/patterns';

const DEFAULT_CATEGORIES: SuspiciousRequestConfig['checks'] = [
  'sql',
  'nosql',
  'xss',
  'commandInjection',
  'pathTraversal',
  'templateInjection',
  'prototypePollution',
];
const DEFAULT_INSPECT: SuspiciousRequestConfig['inspect'] = ['query', 'params', 'body'];
const MAX_DEPTH = 6; // guards against pathological/deeply-nested payloads costing us CPU
const MAX_STRING_LEN = 8000; // don't regex-scan absurdly long strings (e.g. base64 blobs)

interface Finding {
  pattern: CompiledPattern;
  location: string;
  key: string;
}

function getDepth(value: unknown, depth = 0): number {
  if (value == null || typeof value !== 'object') {
    return depth;
  }

  let max = depth;

  for (const child of Object.values(value as Record<string, unknown>)) {
    max = Math.max(max, getDepth(child, depth + 1));
  }
  

  return max;

}





function scan(value: unknown, location: string, patterns: CompiledPattern[], depth = 0, keyPath = ''): Finding | null {

  
  
  if (depth > MAX_DEPTH || value == null) return null;

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LEN) return null;
    for (const pattern of patterns) {
      if (pattern.regex.test(value)) {
        return { pattern, location, key: keyPath || '(value)' };
      }
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = scan(value[i], location, patterns, depth + 1, `${keyPath}[${i}]`);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Prototype pollution: the dangerous signal is the *key name* itself,
      // not just a string that happens to contain it.
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        const protoPattern = patterns.find((p) => p.category === 'prototypePollution');
        if (protoPattern) return { pattern: protoPattern, location, key };
      }
      const found = scan(val, location, patterns, depth + 1, keyPath ? `${keyPath}.${key}` : key);
      if (found) return found;
    }
  }

  return null;
}

export function createSuspiciousRequestMiddleware(config: SuspiciousRequestConfig, fail: FailFn): RequestHandler {
  const categories = config.checks ?? DEFAULT_CATEGORIES;
  // const inspect = config.inspect ?? DEFAULT_INSPECT;
  const inspect = (config.inspect ?? DEFAULT_INSPECT) as NonNullable<
  SuspiciousRequestConfig['inspect']
>;
  const action = config.action ?? 'block';
  const patterns = patternsForCategories(categories as never);

  return function suspiciousRequest(req: Request, res, next) {
    if (req.body && getDepth(req.body) > MAX_DEPTH) {
  return fail(
    req,
    res,
    'SUSPICIOUS_REQUEST',
    'Payload nesting too deep (DoS attempt)'
  );
}
    const sources: Array<[string, unknown]> = [];

    
    if (inspect.includes('query')) sources.push(['query', req.query]);
    if (inspect.includes('params')) sources.push(['params', req.params]);
    if (inspect.includes('body')) sources.push(['body', req.body]);
    if (inspect.includes('headers')) sources.push(['headers', req.headers]);

    for (const [location, value] of sources) {
      const finding = scan(value, location, patterns);
      if (finding) {
        const reason = `${finding.pattern.category} pattern (${finding.pattern.label}) detected in ${finding.location} field '${finding.key}'`;
        if (action === 'log') {
          // caller's logger is invoked via fail() normally, but 'log' mode
          // should not block - so just fall through after noting it on shield ctx.
          req.shield.suspicious = req.shield.suspicious ?? [];
          req.shield.suspicious.push(reason);
          continue;
        }
        return fail(req, res, 'SUSPICIOUS_REQUEST', reason);
      }
    }
    next();
  };
}
