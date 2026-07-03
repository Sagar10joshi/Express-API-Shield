# Architecture

## Single pipeline, not middleware soup

`apiShield(config)` returns **one** Express `RequestHandler`. Internally it builds an ordered array of stage handlers from your config and runs them in sequence with a tiny custom runner (not `app.use()` per feature), so that:

1. All stages share one `req.shield` context object (id, resolved IP, fingerprint, api key result) computed once.
2. Every rejection funnels through a single `fail()` function → identical JSON shape, one logging call, one audit event, one `onBlocked` hook call — no matter which stage rejected.
3. Ordering is a deliberate, documented security decision, not incidental.

## Stage order and why

1. **requestId** — must be first; every later log/error references it.
2. **trustedProxy / IP resolution** — resolves `req.shield.ip` once. Only trusts `X-Forwarded-For` when `trustedProxies` is explicitly on, to prevent spoofing.
3. **IP blocklist / allowlist** — cheapest possible rejection, before we do any parsing.
4. **userAgentBlock** — cheap header check, still before body work.
5. **CORS** — must run before auth so a preflight `OPTIONS` isn't rejected by the API key check.
6. **bodyLimit** — parses the body (wrapping `express.json`/`urlencoded`); required before any stage that inspects body content.
7. **rateLimit** — reject before spending time on auth/content-inspection for abusive clients.
8. **apiKey** — auth before expensive content inspection.
9. **sanitize** — strips dangerous keys before…
10. **suspiciousRequest** — …scanning content, so sanitized fields don't false-positive on their own removal.
11. **securityHeaders** — response-shaping; ordered last so rejected requests skip the (small) helmet overhead.
12. **plugins** — run last, after all built-ins, and receive the same `fail` helper so third-party checks look identical to first-party ones.

## Config normalization

Every optional feature accepts either a `boolean` or a config object (`bodyLimit: '2mb'` vs `bodyLimit: { json: '2mb' }`, `ipBlocklist: string[]` vs `{ list, enabled }`, etc). `core/pipeline.ts` normalizes each into a concrete object once at middleware-construction time (not per-request), so the hot path never re-parses config shape.

## Presets as data

Presets (`core/config.ts`) are plain partial `ApiShieldConfig` objects, shallow-merged *underneath* the user's explicit config. This keeps preset logic declarative and trivially testable/extensible — adding a 4th preset is one object literal, no branching.

## Performance choices

- Regex patterns for injection detection are module-level constants (compiled once, not per-request).
- `sanitize` mutates in place rather than deep-cloning.
- Suspicious-request scanning has a recursion depth cap (6) and per-string length cap (8000 chars) to bound worst-case CPU on adversarial payloads.
- Pipeline construction (normalizing config, building the stage array) happens once when `apiShield()` is called, not per-request.

## Extensibility: plugins

A plugin is `{ name, setup(ctx) => RequestHandler | void }`. `ctx` gives plugins the same `fail()` helper, resolved `config`, and `logger` that built-in stages use, so a plugin's rejections are indistinguishable in shape/logging/audit-trail from a built-in one.
