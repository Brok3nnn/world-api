# @repo/gateway

The public data API: it answers `GET` calls with the current value of an endpoint, refreshing it
through the recipe engine when it is stale. The design is in
[docs/architecture/gateway.md](../../docs/architecture/gateway.md); the contract it serves is in
[docs/architecture/api.md](../../docs/architecture/api.md).

## Shape

| Folder | Holds |
| --- | --- |
| `src/app.ts` | `createApp(deps)`: the whole gateway as one Web-standard `Request` → `Response` function |
| `src/routes/` | One file per route (`healthz`, `search`, `build-status`, `endpoint-value`); `route.ts` is the shape every route has |
| `src/pipeline/` | One file per stage of serving a call: `assign-request-id`, `read-query`, `parse-request`, `limit-rate`, `resolve-endpoint`, `guard-price`, `read-value`, `refresh-once`, `refresh-value`, `mix-reader`, `usable-sources`, `build-envelope`, `render-shape`, `record-usage` |
| `src/ports/` | One interface per file: `endpoint-directory`, `value-store`, `recipe-runner`, `source-rate-limiter`, `endpoint-status-store`, `refresh-lock`, `caller-directory`, `rate-limiter`, `usage-sink`, `catalog-search`, `build-queue` |
| `src/adapters/engine/` | The recipe runner over `@repo/recipes`, every fetch through the egress policy |
| `src/adapters/memory/` | Ports in memory: the refresh lock and rate limiters of a single process, and fakes for tests |
| `src/adapters/postgres/` | Ports over `@repo/db`; the endpoint directory sits behind a cache of 30 s and 1 000 entries |
| `src/gateway-deps.ts` | `GatewayDeps`: the ports `createApp` is built from |
| `src/catalog/` | Tests that run each seeded catalog endpoint over recorded responses (`catalog/testing/`) |
| `src/testing/` | `test-deps`: the ports with fakes, and a served endpoint to build test data from |
| `src/responses/` | Response builders shared by routes and stages, such as the contract error body |
| `src/env.ts`, `src/log-events.ts` | Configuration (`LOG_LEVEL`, `USER_AGENT_CONTACT`) and the named log events |
| `src/adapters/stdout/` | The `Logger` that writes one JSON line per event |
| `src/entry/` | `local-gateway` (the seeded in-process database, Postgres adapters and the real engine), the Node entry, and the server that adapts Node's HTTP to the app |
| `src/proof/` | Proof B: `proveGateway`, its report, and the `proof` command (`pnpm proof:gateway`) |

Every adapter of a port runs the same tests, kept beside the port in `src/ports/testing/`.

`pnpm dev:gateway` starts it on `127.0.0.1:8787`: it migrates and seeds an in-process Postgres
(PGlite) with the six catalog endpoints, then refreshes each from its live source on the first
call. It reads `USER_AGENT_CONTACT` and `LOG_LEVEL` from the environment or the repository's
`.env`.

## Rules

- Portable: Node modules and globals only in `src/entry/`, `env.ts`, `src/adapters/postgres/`
  and commands (lint), and `portable-app.test.ts` runs every route through Web-standard objects.
- No HTTP framework: a route table of Web-standard functions keeps the gateway portable to edge
  isolates without a dependency (decision 0003).
- Every response carries `x-request-id`. Expected outcomes are values; the one `catch` in
  `app.ts` turns a defect into `500 internal_error` with no detail for the caller.
- Depends on `@repo/contracts`, `@repo/core`, `@repo/recipes` and `@repo/db`.
- Coverage floor: 90 % for lines, branches, functions and statements.
