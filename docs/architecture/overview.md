# Architecture overview

The shape of the whole system: its apps, its shared packages, how a call flows through them,
and the rules that keep it portable and testable. Details live in the documents linked from
each section; the reasons behind the main choices are in [../decisions/](../decisions/README.md).

## System in one picture

```
 [person in browser]              [program, curl, AI agent]
          │                                   │
          ▼                                   ▼
 ┌──────────────────┐          ┌────────────────────────────────────────┐
 │ apps/web         │          │ apps/gateway   (public data API)       │
 │ Next.js prototype│          │ parse → resolve → read or refresh →    │
 │ on sample data   │          │ firewall → shape → record usage        │
 └──────────────────┘          └──────┬───────────────────────┬─────────┘
   not connected yet                  │ stale value           │ reads and writes
                                      ▼                       ▼
                             ┌─────────────────┐     ┌──────────────────────────┐
                             │ packages/recipes│     │ packages/db → Postgres   │
                             │ engine, egress  │     │ endpoints, recipes,      │
                             │ policy, firewall│     │ values, sources, usage   │
                             └────────┬────────┘     └──────────────────────────┘
                                      │ GET, allow-listed hosts only
                                      ▼
                              [approved public sources]
```

The builder agent that turns a request into a new endpoint is **Design — not implemented**
([builder.md](builder.md)); the build queue it would fill already exists in the database and
behind the gateway's `BuildQueue` port.

## Building blocks

| Unit | Kind | Responsibility | Detail |
| --- | --- | --- | --- |
| `apps/web` | Next.js app | Design prototype of the product on typed sample data | [web.md](web.md) |
| `apps/gateway` | `Request` → `Response` function, no framework | The public data API; the only hot path | [gateway.md](gateway.md), [api.md](api.md) |
| `packages/contracts` | Library | Wire formats as Zod schemas; the OpenAPI document is generated from them | [api.md](api.md) |
| `packages/core` | Library | Pure rules: freshness, pricing, shapes, statuses, `Result`, ids | [../conventions.md](../conventions.md) |
| `packages/recipes` | Library | The recipe engine, its egress policy and the output firewall | [recipes.md](recipes.md) |
| `packages/db` | Library | Drizzle schema, SQL migrations, query modules and seed data | [data-model.md](data-model.md) |

One language everywhere: TypeScript ([decision 0001](../decisions/0001-typescript-everywhere.md)).

## A call

`GET /@owner/slug`: the gateway resolves the endpoint, returns the stored value if it is fresh,
otherwise runs the active recipe once for all concurrent callers, checks the result against the
endpoint's output spec, stores it, renders the requested shape and records a usage event. No
model runs on this path. See [gateway.md](gateway.md).

## Layers and dependency rules

```
apps/web      apps/gateway          composition roots: wire adapters to ports
                    │
                packages/db         infrastructure
                    │
packages/recipes ───┤
     │              │
packages/core ◄─────┘
     │
packages/contracts
```

1. Dependencies point down only. A package never imports an app; a lower package never imports
   a higher one; apps never import each other.
2. `contracts` depends on the schema library only, `core` on `contracts` only. Neither performs
   I/O, reads the clock or reads configuration.
3. Every external system (database, network, clock, randomness) is reached through a port.
   Ports are declared by the code that needs them; adapters are chosen in a composition root.
4. Cross-package imports use a package's declared entry points, never a deep path.

Lint enforces these rules: one `noRestrictedImports` override per workspace in `biome.json`
lists what that workspace may not import, and `noImportCycles` forbids cycles.

## Staged hosting

The gateway is written so that its hot path can move from a Node process to edge isolates
without a rewrite ([decision 0003](../decisions/0003-staged-hosting.md)). Nothing is deployed
today; both stages are **Planned**.

| Concern | Stage 1 | Stage 2 |
| --- | --- | --- |
| Gateway runtime | Node function | Edge isolates |
| Endpoint and value reads | Postgres by primary key plus an in-process cache | Edge key-value store |
| Refresh coordination | Postgres advisory lock | Per-endpoint coordinator object |
| Rate limiting | In memory, then a shared key-value store | Per-caller coordinator object |
| Usage events | Postgres append-only table | Queue into an analytics store |

What makes the move mechanical: the gateway core uses Web-standard APIs only, and everything in
the table sits behind a port. `portable-app.test.ts` checks this by answering every route
through Web-standard `Request` and `Response` objects alone.

## Quality targets

| Attribute | Target | How the design meets it |
| --- | --- | --- |
| Latency, fresh value | One keyed lookup, no recipe run | Stored values with an expiry; in-process endpoint cache |
| Latency, refresh | Bounded by the recipe limits | Step and run timeouts; single-flight; stale value on failure |
| Correctness | No value leaves unless it matches its output spec | Output firewall on every refresh |
| Availability | A broken source degrades one endpoint, never the gateway | Per-endpoint isolation, timeouts, grace period, `degraded` status |
| Safety | A recipe can only read approved public hosts | Egress policy in the engine; see [security.md](security.md) |
| Change | Any module replaceable without touching its callers | Ports, contracts and the limits in [../conventions.md](../conventions.md) |

## Scalability rules

- No state in a process that another instance would need. Caches hold only data that is safe to
  be stale, and are bounded in size and time.
- No database reads in a loop; one query per need, lists paginated.
- No response waits for work the caller does not need (usage events are not awaited).
- Every outbound call has a timeout and a size cap.
- Append-only tables are never updated in place.

## What exists today

- `apps/gateway` serves `/@{owner}/{slug}`, `/search`, `/builds/{id}` and `/healthz`.
  `pnpm dev:gateway` runs it on Node against an in-process Postgres (PGlite), migrated and seeded
  with six catalog endpoints over five live public sources; values are refreshed from the
  sources on demand.
- `packages/recipes` runs declarative recipes with five step kinds behind an egress policy with
  address pinning, and checks every value with the output firewall.
- `packages/db` holds the schema of ten tables, eight migrations, the query modules and the
  seed: the platform account `@core`, six approved sources and six endpoints.
- `packages/contracts` and `packages/core` hold the contracts and the pure rules; the OpenAPI
  3.1 document is generated from the contracts and checked for drift.
- `apps/web` is a design prototype on typed sample data; it does not call the gateway.
- Not built: the builder agent, accounts and API keys, billing, own-data publishing, any
  hosted deployment.
