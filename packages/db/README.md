# @repo/db

The system of record: the Postgres schema, its migrations and the query modules. It is the only
workspace that talks to the database; everything else calls its query functions. The design is
in [docs/architecture/data-model.md](../../docs/architecture/data-model.md).

## Entry points

Each public file is one entry: `@repo/db/<module>/<file>`. The complete list is the `exports`
map in `package.json`; anything not listed there is private to this package.

| Module | Provides |
| --- | --- |
| `client/database` | `Database`: the handle every query function takes first |
| `schema/` | One `<table>-table.ts` per table, such as `accounts-table` |
| `queries/endpoint/` | `find-endpoint` (an endpoint with its active recipe and sources), `list-catalog-endpoints`, `move-endpoint-status` (only from the status it still has), `search-catalog-endpoints` |
| `queries/lock/` | `with-endpoint-lock` (one refresh per endpoint across instances) |
| `queries/recipe/` | `insert-recipe-version`, `activate-recipe-version` |
| `queries/source/` | `get-sources`, `upsert-source` (by name, keeping the id) |
| `queries/value/` | `read-latest-value`, `store-refreshed-value`, `record-refresh-failure`, `append-value-history` |
| `queries/usage/` | `append-usage-event` |
| `queries/build/` | `create-build`, `claim-build`, `advance-build`, `finish-build`, `append-build-event`, `read-build-status` |
| `seed/` | `seed-database`: the platform account `@core`, the approved sources and six catalog endpoints, a mix among them (`catalog/`), idempotent |
| `testing/` | `create-test-database`, `global-setup`, `violated-constraint`, `table-facts`, `test-rows` |

## Changing the schema

1. Edit or add `src/schema/<table>-table.ts`. Only files with this suffix are read by the
   migration generator, so tests beside them are never mistaken for schema.
2. Run `pnpm --filter @repo/db migrations:generate --name=<what-changed>`.
3. Read the generated SQL in `migrations/` and commit it with the schema change. Never edit a
   migration after it is merged.

`pnpm check` runs `pnpm migrations:check`, which fails when the schema has changed without a
migration and restores the folder, so it never leaves files behind.

## Tests

Integration tests run on an in-process Postgres (PGlite): no service, container or account.
`createTestDatabase()` returns a database of its own with every migration applied, copied from
an image in about 0.1 s. Close it in `afterEach`.

- A workspace that uses it lists `@repo/db/testing/global-setup` under `globalSetup` in its
  test configuration. The image is then migrated once per test run; without it, every test
  file migrates at the same moment, which is slow enough under load to time out.
- Test files run three at a time: copying an in-process Postgres is CPU-heavy, and more
  parallel files made every file slower.
- `violatedConstraint(write)` names the constraint a failed write broke.
- `tableFacts(database, table)` compares what a table declares with what Postgres enforces,
  and lists foreign keys without an index; every table test asserts there are none.

## Rules

- Only this package imports a database driver.
- Every parameter is bound; no SQL is built by joining strings.
- May depend on `@repo/contracts` and `@repo/core` only.
- Coverage floor: 90 %. Test doubles in `testing/` are not measured.
