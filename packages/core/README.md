# @repo/core

Pure rules and primitives shared by every app and package. Nothing here performs I/O, reads the
clock, generates randomness or reads configuration: those arrive through the ports declared
here, and the real adapters are chosen in an app's composition root.

## Entry points

Each public file is one entry: `@repo/core/<module>/<file>`. The complete list is the `exports`
map in `package.json`; anything not listed there is private to this package.

| Module | Provides |
| --- | --- |
| `result` | `Result`, `ok`, `err`: outcomes a caller must handle |
| `env/` | `parse-environment`: frozen, typed configuration for an app's `env.ts` |
| `ids/` | `id` (`Id<Kind>`, `EndpointId`, `BuildId`, …, `parseId`), `id-generator` and `random-source` (ports), `create-id-generator` |
| `time/` | `clock` (port), `duration` (`addSeconds`, `secondsBetween`) |
| `log/` | `logger` (port, `LogLevel`, `LogFields`) |
| `freshness/` | `freshness-seconds`, `next-refresh`, `effective-max-age`, `is-stale`, `within-grace` |
| `status/` | `endpoint-transitions`, `build-transitions`, `can-transition`, `next-endpoint-status` |
| `shape/` | `supported-shapes`, `render-number`, `render-text`, `render-csv`, `shape-failure` |
| `sources/` | `usable-source` (`isUsableSource`: `green` and checked within 90 days) |
| `pricing/` | `call-price` (credits from what a recipe reads), `exceeds-price-cap` (a price against `max_price`, both in credits) |

Test doubles, for the tests of any workspace: `time/testing/fake-clock`,
`ids/testing/fake-random-source`, `log/testing/recording-logger`.

## Rules

- Depends on `@repo/contracts` only.
- Every function is deterministic for its arguments and ports. Tests use the fakes above and
  never the system clock, real randomness or the network.
- A typed id is created only by `parseId` (from untrusted input) or an `IdGenerator`.
- Business rules that are data (limits, classes, transition tables) are named constants here,
  each with tests.
- Coverage floor: 95 % for lines, branches, functions and statements.

## Adding a module

1. Create `src/<module>/<thing>.ts` with one main export and `<thing>.test.ts` beside it.
2. A port gets its own file and a fake under `src/<module>/testing/`, with tests.
3. Add one `exports` entry per public file in `package.json` and its row above.
