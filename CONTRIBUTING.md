# Contributing

Thanks for considering a contribution to express-api-shield.

## Setup

```bash
git clone <repo>
cd express-api-shield
npm install
npm run test:watch
```

## Workflow

1. Fork & branch from `main`.
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`...).
3. Add/adjust tests for any behavior change — coverage floor is 95% lines/statements/functions, 90% branches (`vitest.config.ts`).
4. Run `npm run lint && npm run build && npm test` before opening a PR.
5. Add a changeset: `npx changeset` — describe the change and bump type (patch/minor/major).
6. Open a PR against `main`. CI runs lint/build/test/coverage on Node 18/20/22.

## Adding a new detection pattern

Add to `src/utils/patterns.ts` with a `category`, short `label`, and a regex reviewed for catastrophic-backtracking risk (no nested quantifiers on unbounded input). Add both a positive test (`tests/unit/patterns.test.ts`) and a benign-input test proving it doesn't false-positive on ordinary text.

## Adding a new middleware/feature

1. Type it in `src/types/index.ts`.
2. Implement in `src/middleware/<name>.ts`, taking a `FailFn` if it can reject requests.
3. Wire it into `src/core/pipeline.ts` at the correct pipeline position — document *why* that position in a comment.
4. Add unit + integration tests.
5. Document it in `docs/api.md` and the README options table.

## Reporting security issues

Please do not open a public issue — see [SECURITY.md](./SECURITY.md).
