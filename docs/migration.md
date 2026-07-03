# Migration Guide

## From individual middleware packages

Replace this:

```javascript
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
app.use(myApiKeyMiddleware);
```

With:

```javascript
app.use(
  apiShield({
    securityHeaders: true,
    cors: true,
    bodyLimit: '1mb',
    rateLimit: { windowMs: 60_000, max: 100 },
    apiKey: { enabled: true, keys: [...] },
  })
);
```

Notes:
- Error responses change shape: previously-HTML or library-specific error bodies become the unified `{ success, code, reason, requestId, timestamp, documentation }` JSON. Update any client-side error handling that parsed the old shapes.
- `express-rate-limit`'s default `429` body differs from the shield's `RATE_LIMITED` shape — same status code, different JSON.
- If you were relying on `X-Forwarded-For` for IP logic, you must now explicitly set `trustedProxies: true`.

## Version 0.x → future 1.0

No breaking changes yet; this section will track them once the API stabilizes. See [CHANGELOG.md](../CHANGELOG.md).
