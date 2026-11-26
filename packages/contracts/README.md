# @repo/contracts

The wire formats of the system as schemas, and the types derived from them. Every app and
package that sends, stores or receives data parses it with a schema from here, once, at the
boundary where the data enters.

## Entry points

Each public file is one entry: `@repo/contracts/<module>/<file>`. The complete list is the
`exports` map in `package.json`; anything not listed there is private to this package.

| Module | Provides |
| --- | --- |
| `ids` | `idSchema(kind)`, `ID_PREFIXES`: the typed prefix and shape of every entity id |
| `api/` | The parts every route shares: `envelope`, `source-attribution`, `method`, `shape`, `endpoint-path`, `call-parameters`, `max-price`, `error` |
| `search/` | `search-parameters`, `search-page`: the query and the result page of `GET /search` |
| `universal-entry/` | `universal-entry-parameters`, `universal-entry-hit`, `building-body`: `GET /get`, a planned route the gateway does not serve yet |
| `endpoint/` | `output-spec`, `output-schema`, `freshness`, `visibility`, `endpoint-status`, `category`, `endpoint-definition` |
| `recipe/` | `recipe-schema` (parse every recipe with `recipeSchema`), `recipe`, `recipe-step`, `recipe-limits`, `recipe-problems` |
| `build/` | `build-request`, `build-spec`, `build-status`, `build-stage`, `build-status-response`, `build-event`, `test-report`, `stage-failure`: the build queue that the planned builder will fill |
| `source/` | `source-definition`, `source-capabilities`, `source-tier`: an approved origin of data |
| `openapi/` | `openapi-document`: the OpenAPI document of the served routes, derived from the schemas |
| `<module>/examples/` | One valid example per response or document, for tests and documentation |

A file exports its schema as `<thing>Schema` and the derived type as `<Thing>`.

`openapi.json` is generated: after a schema change run `pnpm openapi` and commit it.

## Rules

- Depends on the schema library only. It imports no other workspace.
- No I/O, no clock, no configuration: schemas, types and constants only.
- Types are derived from schemas with `z.infer`, never written beside them.
- A schema only grows in compatible ways. See "Evolving the contract" in
  [docs/architecture/api.md](../../docs/architecture/api.md).
- Every schema has one valid example and one invalid example per rule it enforces, in tests
  next to it.

## Adding a module

1. Create `src/<module>/<thing>.ts` with one main export.
2. Add one `exports` entry for it in `package.json`.
3. Add its row to the table above.
