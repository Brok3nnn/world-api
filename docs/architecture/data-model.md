# Data model

The system of record is one Postgres database, defined in `packages/db` with a typed schema and
generated SQL migrations ([decision 0004](../decisions/0004-database-and-auth.md)). This document
lists the tables, the rules every table follows, and how the schema changes.

## Tables

| Table | One row is | Key columns |
| --- | --- | --- |
| `accounts` | An owner or caller | `id`, `handle` (unique), `display_name`, `kind` (`platform`, `user`), `auth_user_id` (nullable, unique) |
| `sources` | An approved origin of data | `id`, `name` (unique), `hosts` (1 to 10), `docs_url`, `licence` (short name), `attribution` (nullable: none required), `terms` (the conditions read at review, never served), `evidence_url`, `tier`, `policy_checked_at`, `capabilities` (JSON), `rate_limit_per_min` |
| `endpoints` | One addressable API | `id`, `owner_id`, `slug` (unique per owner), `title`, `summary`, `category`, `visibility`, `status`, `method`, `freshness`, `price_credits`, `output_spec` (JSON) |
| `recipe_versions` | One recipe of an endpoint; the document never changes | `id`, `endpoint_id`, `version` (unique per endpoint), `document` (JSON), `test_report` (JSON), `active` (at most one per endpoint), `created_by_build_id` (nullable) |
| `endpoint_sources` | A source an endpoint uses | `endpoint_id`, `source_id` (composite key) |
| `values_latest` | The current value of an endpoint and the state of its refreshes | `endpoint_id` (key), `data` (JSON), `as_of`, `fetched_at`, `expires_at`, `recipe_version_id` (these five are set together or all empty, so failures can be counted before a first value), `consecutive_failures`, `last_error` |
| `values_history` | One past value | `id`, `endpoint_id`, `data`, `as_of`, `recipe_version_id` |
| `builds` | One builder run (the builder is planned; the table and its queries exist) | `id`, `requester_id`, `request` (JSON), `status`, `stage`, `progress`, `attempt`, `endpoint_id` (nullable), `reason`, `locked_until`, `cost_micro_usd` |
| `build_events` | One step of a build's story | `id`, `build_id`, `stage`, `kind`, `message`, `detail` (JSON) |
| `usage_events` | One call | `id`, `endpoint_id`, `caller_id` (nullable), `outcome` (`served` or an error code of the API), `shape`, `price_credits`, `latency_ms`, `refreshed` |

`values_history`, `build_events` and `usage_events` are append-only: rows are inserted, never
updated or deleted by application code.

## Rules for every table

| Topic | Rule |
| --- | --- |
| Names | Tables plural snake_case; columns snake_case; no abbreviations except `id` and `url` |
| Primary key | `id text`, a typed prefix plus a time-ordered unique id: `ep_…`, `acc_…`, `src_…`, `rv_…`, `bld_…`, `bev_…`, `val_…`, `use_…`. Generated in the application by the `IdGenerator` port of `packages/core` (`newId(kind)`). On the wire an id is its prefix, an underscore and 1–64 characters of `0-9a-z_`, parsed with `idSchema` from `@repo/contracts/ids` |
| Time | `timestamptz`, UTC. Every table has `created_at`; mutable tables also have `updated_at`. Instants end in `_at`, or in `_until` for the end of a lock. Durations are integers named with their unit: `_s` for seconds, `_ms` for milliseconds |
| Money | Integers only. Prices in credits (`price_credits`); real money in micro-USD (`*_micro_usd`). Never floating point |
| Enumerations | `text` with a `check` constraint that lists the members. When the enumeration has a schema in `packages/contracts`, the check is generated from it (`oneOf`, `enumValues`) so the two cannot disagree; `accounts.kind` has none yet because it never leaves the database |
| JSON columns | Always have a schema in `packages/contracts`; validated on write and on read. No untyped JSON |
| Foreign keys | Declared, indexed, with an explicit `on delete`: `cascade` for rows an endpoint owns (recipe versions, values), `restrict` for evidence that must outlive it (usage), `no action` where a cascade passes through |
| Uniqueness | Enforced by the database, never only by application code |
| Nullability | `not null` unless absence is meaningful and documented |
| Soft delete | None. An endpoint is `disabled`; history stays |
| Row-level security | Enabled on every table with no permissive policy. All access is server-side through `packages/db`; a policy is added only when a decision record introduces direct client access |

## Indexes that the hot paths need

| Query | Index |
| --- | --- |
| Resolve `@owner/slug` | `accounts(handle)` unique; `endpoints(owner_id, slug)` unique |
| Read the active recipe | `recipe_versions(endpoint_id) where active`, unique: the database allows one active version per endpoint |
| Read the current value | `values_latest(endpoint_id)` primary key |
| Claim the next build | `builds(status, locked_until)` |
| List a catalog page | `endpoints(visibility, status, created_at)` |
| Search the catalog | `endpoints_search_idx`: GIN over `to_tsvector('simple', title \|\| ' ' \|\| summary \|\| ' ' \|\| category)`; queries use the same expression |

Any new query that filters or orders a table adds its index in the same migration.

## State machines

| Endpoint status | May move to | When |
| --- | --- | --- |
| `building` | `live` | Its build published it |
| `live` | `degraded`, `disabled` | The third refresh failure in a row; its owner disables it |
| `degraded` | `live`, `disabled` | The next successful refresh; its owner disables it |
| `disabled` | `live` | Its owner re-enables it |

| Build status | May move to |
| --- | --- |
| `queued` | `running` |
| `running` | `succeeded`, `failed`, `rejected` |
| `succeeded`, `failed`, `rejected` | Nothing: an ended build never changes |

- A build is `rejected` when it must not or cannot be built; `failed` when the builder itself
  could not finish. Neither is ever charged.
- The tables are data in `packages/core` (`status/`), with one function that checks a move and
  one that gives an endpoint's status after a refresh. No caller decides a transition itself.

## Access rules

- Only `packages/db` imports the database driver. It exports one module per query, grouped in
  one folder per aggregate under `src/queries/`: `endpoint`, `recipe`, `source`, `value`,
  `usage` and `build`.
- A query function does one thing, takes a database handle as its first argument and returns
  plain typed data, never a driver object. Transactions are opened by the caller that owns the
  unit of work.
- No query builds SQL by string concatenation. Parameters are always bound.
- Lists take `{ limit, cursor }` and return `{ items, nextCursor }`. `limit` has a maximum.
  Cursors are opaque, keyset-based, and carry timestamps as Postgres text so no microsecond is
  lost; a cursor that was not issued by the list is refused. Search is the one exception: its
  order is a ranking, not a key, so its cursor is an offset, bounded at 500.
- Ids and JSON read back from the database are parsed with their contracts; a mismatch is a
  defect and throws.

## Changing the schema

1. Edit the table file (`packages/db/src/schema/<table>-table.ts`), generate the migration with
   `pnpm --filter @repo/db migrations:generate --name=<what-changed>`, read the generated SQL.
   `pnpm check` fails when the schema and the migrations disagree.
2. One migration per pull request. A migration is never edited after it is merged.
3. Destructive changes take two releases: first add the new shape and write both
   (expand), later remove the old one (contract). Dropping a column or table needs a decision
   record.
4. Every migration is applied to an in-process Postgres in the test run; a migration that does
   not apply cleanly to an empty database and to the previous schema fails the gate.
5. Seed data (the platform account, the source registry, the first catalog endpoints) lives in
   `packages/db/src/seed/` as typed modules and is idempotent.

## Local and test databases

Tests, proofs and `pnpm dev:gateway` run on an in-process Postgres (PGlite), so no service or
container is needed to run or verify anything. Its rows live as long as the process. A hosted
Postgres for deployed environments is **Planned**; none exists.

There are eight migrations, `0000_accounts` to `0007_source_attribution_and_shapes`. The last
one gives sources a short `licence` with their full `terms` beside it, lets `attribution` be
empty, and removes the `probability` shape from the usage check.
