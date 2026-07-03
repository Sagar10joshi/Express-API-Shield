import type { ShieldLogger } from '../types';

const noop: ShieldLogger = {
  info() {},
  warn() {},
  error() {},
};

const consoleLogger: ShieldLogger = {
  info: (msg, meta) => console.log(`[shield:info] ${msg}`, meta ?? ''),
  warn: (msg, meta) => console.warn(`[shield:warn] ${msg}`, meta ?? ''),
  error: (msg, meta) => console.error(`[shield:error] ${msg}`, meta ?? ''),
};

/** `logging` accepts `true` (default console logger), `false`/undefined (silent), or a custom ShieldLogger. */
export function resolveLogger(logging: boolean | ShieldLogger | undefined): ShieldLogger {
  if (!logging) return noop;
  if (logging === true) return consoleLogger;
  return logging;
}
