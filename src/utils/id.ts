import { randomBytes, createHash } from 'crypto';
import type { Request } from 'express';

/** Fast, dependency-free request ID: req_<12 random hex chars>. Not a UUID on purpose - cheaper to generate at high request volume. */
export function defaultGenerateId(): string {
  return `req_${randomBytes(9).toString('hex')}`;
}

/** Stable fingerprint from IP + method + path + UA + a few structural headers. SHA-256, truncated for compactness. */
export function generateFingerprint(req: Request, ip: string): string {
  const parts = [
    ip,
    req.method,
    req.path,
    req.headers['user-agent'] ?? '',
    req.headers['accept-language'] ?? '',
    req.headers['accept-encoding'] ?? '',
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}
