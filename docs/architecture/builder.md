# Builder

> **Design — not implemented.** No `packages/builder` exists, and no code in this repository
> calls a language model. This document is the design the rest of the system is built to
> accept: the recipe contract, the source registry with its capabilities, the `builds` and
> `build_events` tables with their queries, and the gateway's `BuildQueue` port and
> `/builds/{id}` route already exist.

`packages/builder` would be the agent that turns a request ("free spots in my car park, every 15
minutes") into a tested, published endpoint. A model is used here and only here: to read the
request and to draft the recipe. Everything the model produces is checked by deterministic code
before it can affect anything.

## Pipeline

```
request
  │ interpret       request text and options → build spec
  │ discover        build spec → candidate sources and reusable endpoints
  │ check-policy    candidates → permitted sources, or rejected
  │ draft           permitted sources and samples → recipe and output spec
  │ test            trial runs in the engine → test report
  │ ↺ repair        failed report → new draft, at most 3 attempts
  │ publish         recipe, output spec, sources → live endpoint
  ▼
endpoint
```

| Stage | Input | Output | Uses a model | Fails as |
| --- | --- | --- | --- | --- |
| `interpret` | Request text, sources count, shape, freshness | Build spec: fields wanted, units, subject, freshness, shape | Yes | `rejected` when the request is not a request for data, or is a prohibited category |
| `discover` | Build spec | Ranked candidates from the source registry; existing endpoints that already answer it | No | `rejected` when nothing matches |
| `check-policy` | Candidates | Sources with tier and evidence; `red` removed | No | `rejected` when only `red` sources remain |
| `draft` | Build spec, source capabilities, live sample responses | Recipe document and output spec | Yes | `failed` after the attempt limit |
| `test` | Draft | Test report over 5–20 trial runs | No | Back to `repair` |
| `publish` | Passing draft | Endpoint, recipe version, source links | No | `failed` |

Each stage is one module in `src/stages/` with the signature
`(input, deps) → Result<output, StageFailure>`. The pipeline module is the only place that knows
their order.

## Sources the builder may use

The first version builds from the **source registry only**: sources that were reviewed,
have a recorded licence and tier, and carry a machine-readable description of what they offer
(`capabilities`). Discovering new sources on the open web is later work; it would add
candidates to the same `check-policy` stage and never bypass it. See [security.md](security.md)
for tiers.

When an existing endpoint already answers the request, `discover` returns it and the build ends
immediately by pointing at it. When several endpoints together answer it, the draft is a mix:
a recipe of `endpoint.read` steps.

## The model boundary

- The model is reached through one port, `LanguageModel`, with two operations: produce a build
  spec, produce a draft. Both return structured output that is parsed with a schema from
  `packages/contracts`; anything that does not parse is a failed attempt, never a partial
  success.
- Prompts are code: one pure function per prompt in `src/prompts/`, taking typed input and
  returning messages. No prompt text is built inline in a stage. Every prompt has tests with
  fixed inputs.
- Content fetched from a source is data. It is passed to the model inside a clearly delimited
  block, truncated to a fixed budget, and the instructions state that nothing inside it is an
  instruction. Whatever the model answers, only a schema-valid recipe leaves the stage, and the
  recipe is then judged by the engine, the egress policy and the tests.
- The model has no tools. It cannot fetch, store or publish. It proposes; the pipeline disposes.
- Every model call has a token cap, a timeout and a cost that is added to the build.

## The test stage

A draft passes only if all of these hold over the trial runs:

| Check | Rule |
| --- | --- |
| Runs | At least 5 trial runs, spread over at least 20 seconds |
| Success | Every run completes within the engine limits |
| Schema | Every result passes the output firewall |
| Stability | The same fields are present in every run; none is always null or empty |
| Plausibility | Numeric fields stay inside the ranges the build spec declares |
| Policy | Every fetch was allowed by the egress policy for the permitted sources |
| Cost | The recipe uses no more fetches than the request's source count allows |

The test report records each run's outcome, duration and the reason for any failure, and is
stored with the recipe version. A failed report is the input of `repair`, which asks for a new
draft with the failures attached. Three failed drafts end the build as `failed`.

A stage that cannot produce its output returns a stage failure with one code from a closed
list. The code decides how the build ends: `not_a_data_request`, `prohibited_category`,
`no_source` and `policy_blocked` end it as `rejected`; `model_unavailable`, `draft_invalid`,
`tests_failed`, `cost_cap_exceeded` and `publish_failed` end it as `failed`. The list and the
mapping are `STAGE_FAILURE_OUTCOME` in `packages/contracts`.

## State and resumability

| Status | Meaning |
| --- | --- |
| `queued` | Waiting for a runner |
| `running` | A runner holds the lock; `stage` and `progress` say where it is |
| `succeeded` | An endpoint exists; `endpoint_id` is set |
| `failed` | The builder could not finish; `reason` says why |
| `rejected` | It must not or cannot be built; `reason` says why. Never charged |

- The `builds` table is the queue. A runner claims a build by setting `locked_until`; a crashed
  runner's build becomes claimable again when the lock expires.
- Each stage writes its output to the build before the next stage starts, so a resumed build
  continues from the last completed stage instead of repeating model calls.
- Each stage appends `build_events`. The web app shows them as the build's progress.
- Publishing is idempotent: a build that already has an endpoint never creates a second one.

## Ports

| Port | Capability |
| --- | --- |
| `LanguageModel` | Structured generation of a build spec and of a draft |
| `SourceRegistry` | Search approved sources by what they offer |
| `EndpointCatalog` | Find existing endpoints that answer a spec |
| `PolicyChecker` | Tier and evidence for a source, with a cached re-check of machine-readable rules |
| `RecipeTester` | Run a draft in the engine with live fetches |
| `BuildStore` | Load, claim, advance and finish builds; append events |
| `EndpointPublisher` | Create the endpoint, recipe version and source links in one transaction |
| `Clock`, `IdGenerator` | Time and ids |

Ports are declared in `src/ports/`. Tests use fakes from `src/testing/`: a scripted model that
returns prepared outputs in order, a registry with a handful of sources, an in-memory store.

## Runners

| Runner | Where | Used for |
| --- | --- | --- |
| Inline | Same process, awaits the build | Tests, proofs, local development |
| Background | A function of the web app, kicked after a build is queued and swept on a schedule | Deployed environments |

Both call the same `runBuild(buildId, deps)`. Nothing in the pipeline knows which runner
called it.

## Repair

When an endpoint has been `degraded` for longer than its grace period, a repair build is queued
for it. It skips `interpret`, reuses the endpoint's output spec and sources, drafts and tests a
new recipe version, and activates it only if the report passes. The output spec never changes
in a repair.

## What the builder never does

- Publish a public endpoint. A built endpoint is `private`; listing it publicly is a separate,
  reviewed action.
- Use a source that is not in the registry, or one that is `red`.
- Leave a draft half-published. Publishing is one transaction.
- Decide a price below the floor the pricing rules compute from the recipe.
