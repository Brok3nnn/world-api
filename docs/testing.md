# Testing and proofs

How the system is shown to work. Tests prove each unit without leaving the machine; proofs run
the real engine and gateway against live sources and save a report. Coverage floors are checked
on every `pnpm test`.

## Levels

| Level | Proves | Uses | Location |
| --- | --- | --- | --- |
| Unit | A pure function or a pipeline stage behaves for every case | Nothing outside the process | `*.test.ts` next to the source |
| Integration | An adapter or a query works against the real technology | In-process Postgres (PGlite); an HTTP server on the loopback interface | `*.test.ts` next to the source |
| Contract | A response matches the public contract and the OpenAPI document | The gateway built from fakes | `apps/gateway/src/routes/*.test.ts` |
| Port contract | Every adapter of a port behaves the same | One shared suite per port, run against the memory and the Postgres adapter | `apps/gateway/src/ports/testing/` |
| Catalog | Each seeded endpoint yields its value from recorded responses | The real engine, the firewall and the recordings | `apps/gateway/src/catalog/`, `apps/gateway/src/entry/local-gateway.test.ts` |
| Proof | The whole system works against live sources | The real engine, database and network | `pnpm proof:recipe`, `pnpm proof:gateway`; reports in [proofs/](proofs/README.md) |

## What a change tests

| You wrote | You also wrote |
| --- | --- |
| A pure function | Tests for the normal case, each boundary and each failure code |
| A schema | One valid example and one invalid example per rule it enforces |
| A pipeline stage | A test per outcome it can return, using fakes |
| A port | A fake in a `testing/` folder, and the shared suite run against every adapter |
| A query | An integration test on the in-process database |
| A recipe step kind | Success, and every error code it can return |
| A route | A contract test for every status of [architecture/api.md](architecture/api.md) |
| A bug fix | A test that fails without the fix |

## Determinism

- No test reads the system clock, generates randomness or touches the network. Time and ids come
  from fakes (`createFakeClock`, `createFakeRandomSource`); HTTP comes from recorded responses
  or an in-process server on the loopback interface.
- No test depends on another test, on order or on leftover state. Each database test gets a
  fresh database, copied in about 0.1 s from an image migrated once per run.
- No sleeping: tests advance the fake clock. A flaky test is a defect, fixed or removed.
- No mocking library: fakes implement the port honestly in memory, and a test that needs to
  assert on calls uses a fake that records them.

## Recorded responses

A recording is one source response kept as a file: URL, status, media type and body, nothing
else. `createRecordedFetch` replays recordings and fails a test that requests anything that was
not recorded. `pnpm --filter @repo/recipes record <https URL> <file>` captures a new one through
the egress policy; it needs `USER_AGENT_CONTACT`. The recording of the vulnerability catalog is
cut to its first 25 rows to keep the repository small.

## Naming and shape

- `describe` names the unit; `it` states the behaviour as a sentence: `it("returns the stored
  value when it is fresh")`.
- Arrange, act, assert, separated by blank lines. One behaviour per test.
- Test data is built by small named builders (`servedEndpoint()`, `sourceRow()`), not copied
  object literals.

## Coverage

| Workspace | Floor for lines, branches, functions and statements |
| --- | --- |
| `packages/contracts`, `packages/core`, `packages/recipes` | 95 % |
| `packages/db`, `apps/gateway` | 90 % |

Each workspace's `vitest.config.ts` always collects coverage and fails `pnpm test` below its
floor. `testing/` folders are not measured, nor are entry files that only wire adapters and
start (`apps/gateway/src/entry/node.ts`, the `*-command.ts` files): running them is their test,
and what they wire is covered. The web prototype has no tests yet.

Coverage is a floor that catches forgotten tests, not a measure of quality.

## Proofs

A proof is a command that runs a real scenario against live sources and writes a report a person
can read. It lives in the workspace it proves, so it is type-checked, linted and tested like the
rest; its pure parts have unit tests over fakes.

| Proof | Command | Shows |
| --- | --- | --- |
| A | `pnpm proof:recipe` | Hand-written recipes fetch live approved sources through the egress policy and yield values that pass the firewall |
| B | `pnpm proof:gateway` | The gateway, on a migrated and seeded in-process database, serves every catalog endpoint in every shape, refreshes a stale value once under concurrent calls, and degrades without a charge when a source fails |

- A proof prints each step and its evidence, exits non-zero on the first failed expectation, and
  writes `docs/proofs/<proof>-<date>.md`.
- A proof needs `USER_AGENT_CONTACT` and network access. Without the contact it exits with code
  2; when a live source cannot be reached it says so and exits with code 3, never faking a pass.

## The gate

`pnpm verify` runs, in order: lint and format check, type check, dead-code check, structure,
migration and OpenAPI checks, all tests with coverage, and the production build. CI runs the
same command on every push and pull request.
