# Error Reference

Every rejection produced by the shield has this shape:

```json
{
  "success": false,
  "code": "API_KEY_INVALID",
  "reason": "human readable explanation",
  "requestId": "req_xxx",
  "timestamp": "ISO 8601",
  "documentation": "link to this file, anchored to the code"
}
```

| Code | HTTP Status | Meaning | Common fix |
|---|---|---|---|
| `IP_BLOCKED` | 403 | Request IP matched `ipBlocklist`. | Remove IP/CIDR from blocklist, or confirm it should be blocked. |
| `IP_NOT_ALLOWED` | 403 | `ipAllowlist` is non-empty and the IP isn't in it. | Add the IP/CIDR, or check `trustedProxies` if behind a load balancer. |
| `USER_AGENT_BLOCKED` | 403 | User-Agent matched a `blockUserAgents` rule. | Adjust the rule; check for false positives on legitimate clients/bots. |
| `API_KEY_MISSING` | 401 | No key found in the configured header. | Send the header (default `x-api-key`). |
| `API_KEY_INVALID` | 401 | Key present but not valid. | Check the key value/rotation; check a custom `validate` function's logic. |
| `BODY_TOO_LARGE` | 413 | Request body exceeded `bodyLimit`. | Raise the limit or reduce payload size. |
| `SUSPICIOUS_REQUEST` | 400 | Content matched an injection-pattern heuristic. | Inspect `reason` for the field/category; if a false positive, narrow `suspiciousRequests.checks` or switch that field's route to `action: 'log'`. |
| `RATE_LIMITED` | 429 | Too many requests from this client in the window. | Wait, or raise `rateLimit.max`/`windowMs`. |
| `CONFIG_ERROR` | 500 | The shield's own configuration is invalid. | See the console warning emitted at startup. |
| `INTERNAL_ERROR` | 500 | Unexpected error inside the shield. | Please file an issue with the requestId and a repro. |
