# API Reference

## `apiShield(config?: ApiShieldConfig): RequestHandler`

Returns a single Express middleware. Calling with no arguments uses conservative built-in defaults (requestId + logging on, everything else off) — it does **not** implicitly apply a preset.

## `apiShield.production(overrides?)` / `.strict(overrides?)` / `.development(overrides?)`

Shorthand for `apiShield({ preset: 'production', ...overrides })` etc.

## Presets

| Setting | development | production | strict |
|---|---|---|---|
| securityHeaders | CSP off | on | on |
| bodyLimit | 5mb | 1mb | 256kb |
| suspiciousRequests | `action: 'log'` | `action: 'block'` | `action: 'block'` |
| rateLimit | off | 300/min | 60/min |
| trustedProxies | off | on | on |

## `ApiShieldConfig`

See `src/types/index.ts` for the authoritative, fully-typed source of truth (this doc mirrors it). Every feature key accepts `false`/absent to disable it.

### `requestId: boolean | { header?, generator?(req) }`
Adds `req.id` and (default) an `X-Request-ID` response header. If the inbound request already carries that header, it's preserved (trace correlation with an upstream gateway) rather than overwritten.

### `apiKey: { enabled, header?, keys?, validate?(key, req), ignore? }`
- `keys`: static list, compared with `crypto.timingSafeEqual`.
- `validate`: async function for DB-backed/dynamic keys; overrides `keys` when provided.
- `ignore`: route paths (exact, `/prefix/*`, or RegExp) exempt from the check.

### `securityHeaders: boolean | { contentSecurityPolicy?, hsts?, frameguard?, noSniff?, referrerPolicy?, ... }`
Thin wrapper over `helmet`; pass `false` on any sub-key to disable that specific header.

### `bodyLimit: string | { json?, urlencoded? }`
String shorthand sets the JSON limit; urlencoded defaults to match. Wraps `express.json`/`express.urlencoded`.

### `blockUserAgents: Array<string | RegExp | (ua, req) => boolean> | { enabled, block }`
String entries match case-insensitive substring; function entries get the raw UA string and request.

### `ipAllowlist` / `ipBlocklist: string[] | { enabled, list }`
IPv4, IPv6, and CIDR (`10.0.0.0/8`) entries. Blocklist is checked before allowlist. Malformed entries are skipped, not thrown.

### `suspiciousRequests: boolean | { checks?, inspect?, action? }`
- `checks`: subset of `sql | nosql | xss | commandInjection | pathTraversal | templateInjection | prototypePollution` (default: all).
- `inspect`: subset of `query | params | body | headers` (default: `query, params, body`).
- `action`: `'block'` (default) or `'log'` (findings pushed to `req.shield.suspicious`, request continues).

### `sanitize: boolean | { removeKeys? }`
Strips dangerous keys (default `__proto__`, `constructor`, `prototype`) from body/query/params in place.

### `rateLimit: boolean | { windowMs?, max?, ignore? }`
Wraps `express-rate-limit`, keyed by the shield's resolved IP (`req.shield.ip`), not raw `req.ip`.

### `trustedProxies: boolean | { trust }`
Controls whether `X-Forwarded-For` (or Express's own `req.ip` once you've set `app.set('trust proxy', ...)`) is trusted for IP resolution. **Leave this off unless you're actually behind a proxy that sanitizes this header.**

### `cors: boolean | { origin?, methods?, credentials? }`
Minimal built-in CORS handling. For advanced needs (per-route origins, exposed headers, preflight caching) use the `cors` package directly instead.

### `fingerprint: boolean`
Adds `req.shield.fingerprint`, a SHA-256 hash of IP+method+path+UA+a couple of structural headers, for abuse-pattern correlation in logs.

### `ignore: string[]`
Routes that bypass the *entire* pipeline (not just one stage). Use for `/health`, `/metrics`, etc.

### `hooks: { onBlocked?, onRequest?, onResponse?, onError? }`
- `onBlocked(event, req, res)` — fires for every rejection, any stage.
- `onRequest(req, res)` — fires once per request that enters the pipeline (before stages run).
- `onResponse(req, res)` — fires on `res.on('finish')`.
- `onError(err, req, res)` — fires if a stage throws synchronously.

### `plugins: ShieldPlugin[]`
`{ name, setup(ctx: { config, fail, logger }) => RequestHandler | void }`. Runs after all built-in stages.

### `logging: boolean | ShieldLogger`
`true` = console logger, `false`/omitted = silent, or supply `{ info, warn, error }` (e.g. wrap pino/winston).

### `documentationUrl: string`
Overrides the base URL used in error responses' `documentation` field.
