# @repo/recipes

The recipe engine: it runs a validated recipe document step by step and returns the value, or
the step that failed and why. A recipe is data; the engine is the only code that runs. The
design is in [docs/architecture/recipes.md](../../docs/architecture/recipes.md).

## Entry points

Each public file is one entry: `@repo/recipes/<module>/<file>`. The complete list is the
`exports` map in `package.json`; anything not listed there is private to this package.

| Module | Provides |
| --- | --- |
| `engine/` | `run-recipe` (`runRecipe`, `RunOutcome`), `run-trace` (`TraceEntry`), `chained-endpoint-reader` (the `readEndpoint` port of a run), `run-deps` (`RunDeps`), `step-executor` (`StepExecutors`, `StepContext`), `run-failure` (`RunFailureCode`), `json-value` |
| `adapters/` | `node-http-client`, `node-resolve-host`, `timers-wait`: the egress ports on Node, for commands and Node entries only |
| `egress/` | `create-policed-fetch` (`createPolicedFetch`): the `fetch` port of a run, built on the egress policy |
| `expression/` | `evaluate-expression` (private): JSONata with no clock, randomness, `$eval` or regex literals, within the time and depth limits |
| `firewall/` | `apply-firewall` (`applyFirewall`, `FirewallViolation`): only output-spec fields leave the system |
| `proof/` | Proof A: `pnpm proof:recipe` runs golden recipes live and writes the report |
| `recorder/` | The `record` command: one live response through the egress policy, written as a recording |
| `recording/` | `recording` (`Recording`): one source response kept as a file |
| `golden/` | `golden-recipes` (`GOLDEN_RECIPES`): five hand-written recipes over approved sources, with recordings and expected values |
| `steps/` | `step-executors` (`STEP_EXECUTORS`, every kind) and one executor per step kind: `http-get` (`httpGet`), `html-select` (`htmlSelect`), `endpoint-read` (`endpointRead`), `transform` (`transform`), `text-match` (`textMatch`) |
| `ports/` | `source-fetch` (`SourceFetch`), `http-client` (`HttpClient`), `endpoint-reader` (`EndpointReader`), `resolve-host` (`ResolveHost`), `wait` (`Wait`), `body-reader` (`BodyReader`) |

The parts of the egress policy (`check-url`, `resolve-public-addresses`, `deadline`, `read-body`,
`decode-body`) are private: callers use `createPolicedFetch`.

Test doubles, for the tests of any workspace: `ports/testing/fake-source-fetch`,
`ports/testing/fake-endpoint-reader`, `ports/testing/fake-resolve-host`,
`ports/testing/fake-wait`, `ports/testing/fake-body-reader`, `ports/testing/fake-http-client`, and `recording/testing/recorded-fetch`, which replays
recordings and fails on any request that was not recorded.

## Rules

- Depends on `@repo/contracts`, `@repo/core`, `node-html-parser` (HTML and CSS selectors) for
  `html.select`, and, at exact versions (decision 0012), `jsonata` for expressions and `re2js`
  for `text.match`. All are pure JavaScript without code generation.
- A run reaches the outside world only through `RunDeps`: the policed `fetch`, `readEndpoint`
  and the clock. No environment, no global clock, no randomness, no other network access.
- Only `createPolicedFetch` calls the `HttpClient` port, and nothing calls the platform's
  `fetch`; a test scans the sources for both.
- Runs on Node and on edge isolates alike: Web-standard APIs only, no Node built-ins in code
  that a run uses.
- A run is deterministic for the same recipe and the same port answers.
- Coverage floor: 95 % for lines, branches, functions and statements.

## Recording a response

`pnpm --filter @repo/recipes record <https URL> <file>` fetches one response through the egress
policy, with the URL's host as the only one allowed, and writes it as a recording. It needs
`USER_AGENT_CONTACT`, from the environment or the repository's local `.env`, and refuses to
run without it. `pnpm proof:recipe` needs the same and exits with code 2 without it.

## Adding a step kind

Follow "Extending the engine" in `recipes.md`: the executor is one file in `src/steps/`, with
tests for its success and for every failure code it can return.
