# Operations

How the system is configured, run and observed. Today it runs locally only: tests, proofs and
the local gateway all use an in-process Postgres. Hosting is **Planned** and follows the staged
design in [overview.md](overview.md).

## Environments

| Environment | Purpose | Database | Network |
| --- | --- | --- | --- |
| `test` | Automated tests, locally and in CI | In-process Postgres, fresh per test | None; recorded responses and loopback servers |
| `local` | `pnpm dev:gateway` and the proofs | In-process Postgres, migrated and seeded at start | Real, through the egress policy |
| Hosted | Planned | Hosted Postgres | Real |

## Configuration

Every variable is listed here, read in one `env.ts`, and present by name in `.env.example`.

| Variable | Read by | Required | Purpose |
| --- | --- | --- | --- |
| `USER_AGENT_CONTACT` | Gateway; the recipe recorder and the proofs | Yes, to start the gateway or a command that fetches | A contact for source operators, an `https` URL or an email address, sent in the User-Agent `recipe-engine/1 (+<contact>)` of every live fetch. Some sources, such as api.weather.gov, require one |
| `LOG_LEVEL` | Gateway | No, default `info` | Least severe level written: `debug`, `info`, `warn` or `error` |

- `env.ts` passes its schema and the environment to `parseEnvironment` from `packages/core` and
  exports the frozen, typed result. A missing or malformed variable stops the process at start
  with a message that names every such variable and never contains a value.
- Commands read the repository's `.env` when it exists (`node --env-file-if-exists`); every
  other `.env*` file is ignored by Git.
- Behaviour that differs by environment is an adapter choice in a composition root, never a
  feature switch.

## Running locally

| Command | Does |
| --- | --- |
| `pnpm install` | Installs every workspace |
| `pnpm dev:gateway` | Starts the gateway on `127.0.0.1:8787` with the seeded catalog, restarting on changes |
| `pnpm dev:web` | Starts the web prototype on `localhost:3000` |
| `pnpm check` | Lint, types, dead code, structure, migration and OpenAPI checks |
| `pnpm test` | All tests, with coverage floors |
| `pnpm verify` | `check`, `test` and the production build: the full gate |
| `pnpm proof:recipe`, `pnpm proof:gateway` | One end-to-end run against live sources, with a report in `docs/proofs/` |
| `pnpm --filter @repo/db migrations:generate --name=<change>` | Generates the migration for a schema change |

No command needs a container, a global tool or an account.

## Logging

- Structured, one JSON object per line: `time`, `level`, `app`, `event`, `request_id` where
  there is one, and typed fields for that event.
- Events are named constants in the app's `log-events.ts`: `call.defect`, `refresh.failed`,
  `endpoint.status.changed`, `usage.unrecorded`, `source.unusable` and `gateway.started`.
- Never logged: values, query strings, keys, addresses, source response bodies.
- `error` is for defects that need a person. A failing source and a rate-limited caller are
  outcomes, not errors.

## Observability

| Signal | Source | Status |
| --- | --- | --- |
| Calls, outcomes, latency per endpoint | `usage_events` table | Recorded |
| Refresh failures and degraded endpoints | `values_latest` table and `refresh.failed` events | Recorded |
| Synthetic checks, uptime, alerting | Monitoring jobs, hosted error tracking | Planned |

## Deployment

Nothing is deployed. The planned first stage runs the web app and the gateway as two projects on
one managed platform with a hosted Postgres; a later stage can move the gateway to edge isolates
([decision 0003](../decisions/0003-staged-hosting.md)). Rules for that work:

- Pending migrations are applied before new code serves traffic; migrations are backward
  compatible, so the previous build keeps working during a rollout.
- A deployment is promoted only after its smoke proof passes against that environment.

## Continuous integration

`.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile` and `pnpm verify` on Node 24 with
pnpm 11.28.6 for every push and pull request to `main`. No test reaches the network; besides
the package install, only the web build does, to download its fonts with `next/font`.
