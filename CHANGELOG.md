# Changelog

All notable changes to this project are documented via [Changesets](https://github.com/changesets/changesets) and compiled here on release.

## Unreleased

### Added
- Initial public API: `apiShield()`, `.production()`, `.strict()`, `.development()`.
- Features: requestId, apiKey, securityHeaders (helmet wrapper), bodyLimit, blockUserAgents, ipAllowlist/ipBlocklist (CIDR-aware), suspiciousRequests (SQLi/NoSQLi/XSS/command injection/path traversal/template injection/prototype pollution detection), sanitize, rateLimit (express-rate-limit wrapper), trustedProxies, cors (minimal), fingerprint, hooks, plugin system, unified JSON error contract.
