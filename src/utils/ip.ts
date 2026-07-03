import ipaddr from 'ipaddr.js';
import type { Request } from 'express';
import type { TrustedProxyConfig } from '../types';

/**
 * Resolve the "real" client IP.
 *
 * Security note: `X-Forwarded-For` is attacker-controlled unless you sit
 * behind a proxy that overwrites/appends it (e.g. nginx, ALB, Cloudflare).
 * We only trust it when `trustedProxies` is explicitly enabled - otherwise
 * a spoofed header could be used to bypass IP allow/blocklists entirely.
 */
export function resolveClientIp(req: Request, config: TrustedProxyConfig | undefined): string {
  const trust = config?.trust ?? config?.enabled ?? false;

  if (!trust) {
    return normalizeIp(req.socket.remoteAddress ?? '0.0.0.0');
  }

  // Express's own `trust proxy` setting, when configured by the user,
  // already populates req.ip correctly. We defer to it when trust is enabled.
  if (req.ip) {
    return normalizeIp(req.ip);
  }

  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    const first = xff.split(',')[0]?.trim();
    if (first) return normalizeIp(first);
  }

  return normalizeIp(req.socket.remoteAddress ?? '0.0.0.0');
}

function normalizeIp(ip: string): string {
  // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4 -> 1.2.3.4) for consistent matching.
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

/**
 * Returns true if `ip` matches any entry in `list`.
 * Entries may be plain IPv4/IPv6 addresses or CIDR ranges (e.g. "10.0.0.0/8").
 */
export function ipMatchesList(ip: string, list: string[]): boolean {
  let parsedIp: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsedIp = ipaddr.process(ip);
  } catch {
    return false;
  }

  for (const entry of list) {
    try {
      if (entry.includes('/')) {
        // parseCIDR returns [address, prefixLength] - the documented ipaddr.js
        // shape for range matching, rather than guessing a two-arg signature.
        const range = ipaddr.parseCIDR(entry);
        const [rangeAddr] = range;
        if (rangeAddr.kind() !== parsedIp.kind()) continue;
        if (parsedIp.match(range as [ipaddr.IPv4, number] | [ipaddr.IPv6, number])) return true;
      } else {
        const entryAddr = ipaddr.process(entry);
        if (entryAddr.kind() === parsedIp.kind() && entryAddr.toString() === parsedIp.toString()) {
          return true;
        }
      }
    } catch {
      continue; // skip malformed entries rather than throwing at request time
    }
  }
  return false;
}
