# FAQ

**Does this replace helmet / express-rate-limit / cors?**
It wraps helmet and express-rate-limit directly (same underlying behavior, unified config/error shape). The built-in `cors` option is intentionally minimal; swap in the `cors` package for advanced scenarios.

**Is the injection detection a WAF?**
No. It's a heuristic defense-in-depth layer. Use parameterized queries/ORMs as your real defense against injection; see the README's "what suspicious-request detection is and isn't" section.

**Will this slow down my API?**
Each stage is small and short-circuits on rejection. Regexes are precompiled, sanitize mutates in place, and scanning has depth/length caps. Benchmark scripts live in `tests/` — always profile with your own payload shapes for authoritative numbers.

**How do I use a database-backed API key store?**
Use `apiKey.validate(key, req)` — it can be async and hit a DB/cache; it overrides `apiKey.keys` when provided.

**Can I use this with Fastify / Koa?**
No — it's an Express `RequestHandler`. A framework-agnostic core is a plausible future direction; contributions welcome.

**How do I add a custom check without forking?**
Write a plugin: `{ name, setup: ({ fail }) => (req, res, next) => {...} }` and pass it in `plugins: [...]`.
