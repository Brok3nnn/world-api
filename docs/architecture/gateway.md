# Gateway

`apps/gateway` answers the public data API. It is the only hot path of the system, so it is
small, stateless and portable: a pipeline of single-purpose stages over ports, built so the same
code runs on Node now and could run on edge isolates later
([decision 0003](../decisions/0003-staged-hosting.md)). The contract it serves is in
[api.md](api.md).

## Serving one call

```
request
  │ 1 assign-request-id      id for logs and the response header
  │ 2 parse-request          path and query → typed call, or 400
  │ 3 callers.identify       the CallerDirectory port: anonymous for now   (API keys: planned)
  │ 4 limit-rate             per caller, an anonymous caller by address, or 429
  │ 5 resolve-endpoint       @owner/slug → endpoint, or 404
  │ 6 guard-price            price over max_price → 402
  │ 7 read-value             the stored value, when it is young enough
  │ 8 refresh-once           else one refresh per endpoint (refresh-value), or 503
  │ 9 build-envelope         the value with as_of, sources, next_refresh, method, price
  │ 10 render-shape          envelope, number, text or csv, with the cache headers
  │ 11 record-usage          usage event of a resolved call, never awaited by the response
  ▼
response
```

Each stage is one file in `src/pipeline/` and returns a value or a contract error; the route
`routes/endpoint-value.ts` composes them in order. The refresh path is the one place where
stages call each other: `refresh-once` runs `refresh-value`, which runs the recipe and the
output firewall, reads other endpoints through `mix-reader` and allows only the hosts of
`usable-sources`. A stage that needs the outside world takes a port.

| Route | Path | What it runs |
| --- | --- | --- |
| `healthz` | `/healthz` | Nothing: it reads no port, so it answers while a source is down |
| `search` | `/search` | `read-query`, `limit-rate` and the `CatalogSearch` port |
| `build-status` | `/builds/{id}` | `read-query`, `limit-rate` and the `BuildQueue` port |
| `endpoint-value` | `/@{owner}/{slug}` | The stages above |

Any other path, and any method but `GET`, is `404 not_found`.

## Reading and refreshing a value

`read-value` decides with pure rules from `packages/core`:

| Situation | Action |
| --- | --- |
| Stored value is younger than the accepted age | Return it. No recipe runs |
| Stored value has reached the accepted age | Refresh, then return the new value |
| No stored value yet | Refresh |
| Refresh fails and a stored value is within the grace period | Return the stored value, count the failure |
| Refresh fails and nothing acceptable exists | `503 degraded`, not charged |

Refreshing means: take the refresh lock for the endpoint, run the active recipe in the engine,
apply the firewall, store the new latest value and its expiry, append to history, release the
lock. A run may fetch only from the hosts of the endpoint's usable sources: `green` and checked
within 90 days (`isUsableSource` of `packages/core`).

- **Single-flight.** Concurrent calls for a stale endpoint cause one refresh. Within one
  process the others wait for it to end; across instances an advisory lock per endpoint holds
  them a short while (1 s). Then they read the stored value, or the stored one within its grace
  period. The holder reads again before it refreshes, since a refresh may have just ended.
- **Mixes.** A recipe's `endpoint.read` goes through this same pipeline: resolve, read, refresh
  when stale, with the chain of endpoints that led to it, so a mix cannot read in a loop or
  nest more than two levels. An endpoint that cannot answer is `endpoint_unavailable` to it.
- **Demand-driven.** Nothing refreshes without a call. Background warm-keeping is not built.
- **Accepted age.** Without `max_age` it is the endpoint's freshness interval. A larger
  `max_age` lets a caller accept an older value and skip a refresh. A smaller one is raised to
  the interval, the freshness floor: no caller can force refreshes more often than the
  endpoint's class allows.
- **Grace period.** While the source is failing, a value may be served until three freshness
  intervals have passed since it expired. After three consecutive failures the endpoint is
  `degraded`, and the next success makes it `live`. The move happens only from the status the
  endpoint still has, so two instances that see the same failure move it once.
- These rules are pure functions in `packages/core` (`freshness/`), each taking the current
  instant as an argument.

## Ports

One interface per file in `src/ports/`. The pipeline imports ports, never adapters.

| Port | Capability | Stage 1 adapter | Stage 2 adapter (planned) |
| --- | --- | --- | --- |
| `EndpointDirectory` | Find an endpoint by owner and slug | Postgres plus bounded in-process cache | Edge key-value |
| `ValueStore` | Read and write the latest value; append history | Postgres | Edge key-value plus object storage |
| `RefreshLock` | Mutual exclusion per endpoint | Postgres advisory lock | Coordinator object |
| `RecipeRunner` | Run a recipe version | `packages/recipes` in process | Unchanged |
| `RateLimiter` | Allow or deny a call | In memory | Coordinator object |
| `SourceRateLimiter` | Keep each source within its requests per minute | In memory | Coordinator object |
| `CallerDirectory` | Resolve a key to a caller | Anonymous only | Edge key-value |
| `UsageSink` | Record a usage event | Postgres insert, fire-and-forget | Queue |
| `EndpointStatusStore` | Move an endpoint between `live` and `degraded` | Postgres | Unchanged |
| `BuildQueue` | Read a build's status; queuing arrives with the planned builder | Postgres | Unchanged |
| `CatalogSearch` | Match a query to endpoints | Postgres full-text | Search index |
| `Clock` | Current time | System clock | System clock |

`src/app.ts` exports `createApp(deps)`, where `deps` is the set of ports. It returns the whole
gateway as one Web-standard `Request` → `Response` function over a table of routes, with no HTTP
framework. `Logger`, `RandomSource` and the id generator come from `packages/core`. Whoever
starts the gateway chooses the adapters:

- `pnpm dev:gateway` runs `src/entry/node.ts`, which opens an in-process Postgres (PGlite),
  migrates and seeds it, and builds the gateway with `createLocalGateway`
  (`src/entry/local-gateway.ts`): the Postgres adapters behind a cached endpoint directory, the
  real engine with the Node HTTP client, and the memory refresh lock and rate limiters, since one
  process owns that database.
- `pnpm proof:gateway` wires the same adapters with a clock it can move and a source host it can
  make fail.
- Tests pass fakes and memory adapters; `local-gateway.test.ts` runs the local composition over
  the test database with recorded responses instead of the network.

## Portability rules

- Pipeline, routes and ports use Web-standard APIs only: `fetch`, `Request`, `Response`, `URL`,
  `crypto.subtle`, streams. No Node built-ins, no filesystem, no process globals.
- Node-only code is allowed in `src/entry/`, `src/adapters/postgres/` and commands
  (`*-command.ts`) only.
- No dependency that needs code generation at runtime or native bindings may be imported by the
  pipeline.
- Lint enforces this: in `packages/contracts`, `packages/core`, `packages/recipes` and the
  gateway, Node built-in modules and the globals `process`, `Buffer`, `__dirname` and `require`
  are refused, except in entries, `env.ts`, Node adapters, commands and tests.
- `portable-app.test.ts` boots the app from memory adapters and the real engine and answers
  every route through Web-standard `Request` and `Response` alone. If that test needs a change
  to pass, the change is wrong.

## Caching

| Layer | What | Lifetime |
| --- | --- | --- |
| HTTP | Public values of public endpoints | Until `next_refresh`, through `cache-control` |
| HTTP | Search pages | 60 s; build status and health are never cached |
| In process | Endpoint definitions and active recipes | 30 s, at most 1 000 entries |
| Store | Latest values | Until `expires_at` |

Nothing that depends on the caller (balances, limits, private values) is ever cached in a shared
layer.

## Errors and logging

- Stages return errors as values (`Result`), using the codes of [api.md](api.md). Exceptions are
  for defects only and are turned into `500 internal_error` by one handler in `app.ts`.
- The facts of each endpoint call (outcome, shape, price, latency, `refreshed`) are its usage
  event, not a log line. The log holds the events of `src/log-events.ts`: defects, refresh
  failures, status changes, unrecorded usage and start-up. Values, keys and query text are
  never logged.
- A failing source is not a gateway error: it is an outcome (`degraded`) of one endpoint.

## Performance budget

Design targets for a deployed instance; nothing is deployed, so they are not measured yet.

| Step | Budget |
| --- | --- |
| Stages 1–6 on a warm instance | 10 ms |
| Fresh read (stage 7 without refresh) | One keyed lookup |
| Stages 8–9 | 5 ms |
| Stage 10 | 0 ms on the response path |

A change that adds a database round trip to a fresh read needs a decision record.

## What the gateway never does

- Run a model. Model work belongs to the builder and to later `model.extract` steps.
- Write anything a caller did not cause: no schedulers, no background loops.
- Know about pages, sessions or the web app.
- Return a field that is not in the endpoint's output spec.
