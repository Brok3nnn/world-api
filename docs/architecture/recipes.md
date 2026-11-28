# Recipes

A recipe is the heart of an endpoint: a declarative document that says how to produce the value
from approved sources. It is written once (by hand for the catalog today; by the planned builder
agent later); afterwards every refresh runs the recipe in the engine with no model involved
([decision 0005](../decisions/0005-declarative-recipes.md)).
The schema lives in `packages/contracts`, the engine in `packages/recipes`.

## Why declarative

A recipe is data, not code. The engine is the only code that runs, so a recipe cannot do
anything the engine does not offer: it cannot open a socket, read a secret, loop forever or
reach a host that is not allow-listed. That makes every recipe safe to run in the gateway
process, portable to every runtime, and testable by replaying recorded responses.

## The document

```json
{
  "version": 1,
  "steps": [
    {
      "id": "forecast",
      "use": "http.get",
      "url": "https://api.example.org/v1/forecast?latitude=48.21&longitude=16.37",
      "expect": "json"
    },
    { "id": "rate", "use": "endpoint.read", "ref": "@core/eur-huf" },
    {
      "id": "out",
      "use": "transform",
      "expr": "{ \"temperature_c\": forecast.current.temperature, \"eur_huf\": rate.rate }"
    }
  ],
  "output": "out",
  "as_of": "forecast.current.time"
}
```

| Field | Meaning |
| --- | --- |
| `version` | Schema version of the document. The engine rejects versions it does not know |
| `steps` | Ordered list, 1 to 12. A step may read the results of earlier steps by their `id`: lowercase snake_case, at most 32 characters |
| `output` | The `id` of the step whose result is the endpoint's value |
| `as_of` | Optional expression for when the value was observed; it must yield a UTC instant, and a failure is reported under `as_of`. Without it, the time the last fetch finished, or the end of the run for a recipe that fetches nothing |

A recipe is parsed with `recipeSchema` from `packages/contracts` wherever it enters the system.
Beyond the shape of each step it enforces the rules that span steps: step ids are unique, a
step reads only earlier steps, `output` names a step, and the fetch and size limits hold. Every
broken rule is reported at once, in a sentence that names the step.

## Step kinds in version 1

| `use` | Does | Fields |
| --- | --- | --- |
| `http.get` | Fetches one URL of an approved source | `url`, `expect` (`json`, `text`, `html`, `csv`), optional `headers`: only `accept` and `accept-language` |
| `transform` | Computes a result from earlier results with one expression | `expr` |
| `html.select` | Reads text or an attribute from elements of an HTML result | `from`, `selector`, optional `attr` (the text when absent), optional `all` (every match instead of the first) |
| `text.match` | Captures groups from a text result with a pattern | `from`, `pattern`, `flags` (any of `i`, `m`, `s`, `u`, each once) |
| `endpoint.read` | Reads the current value of another endpoint (this is how a mix works) | `ref` |

`http.get` fails with `fetch_failed` on a status outside 200–299, and with `unexpected_content`
when the declared media type contradicts `expect` or the body does not parse. `text/plain`,
`application/octet-stream` and no type at all contradict nothing, since many sources send them
for any body. A `csv` body becomes a list of records keyed by the header row: the delimiter is a
comma or a semicolon, whichever the header uses more, unquoted cells are trimmed, and every
value stays text for a later `transform` to convert.

`html.select` reads text as a person would: entities decoded, white space collapsed, the inside
of scripts and styles never matched, and preformatted text read as HTML, as browsers do. Matches without the `attr` attribute are passed over. No
match, or a selector that cannot be read, fails with `selector_empty`; a result that is not
HTML text fails with `unexpected_content`.

`text.match` uses RE2 syntax on an engine that runs in linear time, so no pattern can backtrack
without end; back-references and lookaround do not exist. It returns the groups of the first
match: an object when the pattern names its groups, a list when they are numbered, the whole
match when there are none, and `null` for a group that took no part. No match, or a pattern the
engine cannot use, fails with `pattern_no_match`.

Expressions are JSONata ([decision 0012](../decisions/0012-recipe-expression-and-pattern-languages.md)),
evaluated against one object that holds every earlier step's result under its step id, without
any I/O. `$now`, `$millis`, `$random`, `$shuffle` and `$eval` are disabled, and a regular
expression literal is refused because it could backtrack without end: patterns belong in
`text.match`. Evaluation stops with `limit_exceeded` past `RUN_LIMITS.expressionMs`, measured
with the run's clock, or past `RUN_LIMITS.expressionDepth`. An expression that yields nothing,
or anything that is not JSON, fails with `expression_failed`.

Reserved step kinds, **Planned** and not available: `model.extract` (a small model reads
unstructured content) and `code.run` (an isolated program for sources the steps above cannot
handle).

## Limits

| Limit | Value |
| --- | --- |
| Steps per recipe | 12 |
| `http.get` steps per recipe | 4 |
| Time per step | 10 s |
| Time per run | 20 s |
| Response size per fetch | 2 MB |
| Expression evaluation | 250 ms, depth 64 |
| Text read by `text.match` | 2 MiB of characters |
| `endpoint.read` nesting | 2 levels, no cycles |
| Document size | 32 KB |

The limits a document must respect by its structure (steps, fetches, document size) are the
constants `RECIPE_LIMITS` in `packages/contracts`, because the recipe schema enforces them. The
limits of a run are the constants `RUN_LIMITS` in `packages/recipes`. All are covered by tests.
Raising one needs a decision record.

## Egress policy

Every fetch passes the policy before any byte leaves:

- `https` only, on its standard port; `GET` only, no request body, no credentials in the URL.
- The host must be on the allow-list of the run. The gateway builds it from the `hosts` of the
  sources linked to the endpoint that may be used: `green` and checked within 90 days
  (`usable-sources.ts`).
- Every address the host resolves to must be public: no loopback, private, link-local,
  metadata, documentation or multicast ranges, and no IPv6 block that tunnels to an arbitrary
  IPv4 address. One private answer refuses the request. A host written as an address is held
  to the same rule and must still be on the list.
- The request connects only to the addresses that were checked, so a second name lookup cannot
  lead it elsewhere.
- One time budget, the time of the step, covers the request, its redirects and the body. The
  body is read as it arrives and dropped at the first chunk past the size cap.
- Text is decoded as UTF-8, or as Latin-1 when the source declares it.
- Redirects are followed at most twice, and every hop passes the policy again.
- A fixed user agent with the platform's contact identifies every request:
  `recipe-engine/1 (+<contact>)`, from `userAgentFor`. The caller that builds the policed fetch
  reads the contact (`USER_AGENT_CONTACT`) from its own configuration, so the engine reads none.
- The source's rate limit is respected: the policed fetch asks a `SourceRateLimit` port
  before each request, and a source over its `rate_limit_per_min` gets nothing sent
  (`policy_denied`). The gateway counts per source in each minute; a command that sends a few
  requests by hand passes `NO_RATE_LIMIT`.

The policy is one module, `src/egress/`, with exhaustive tests. `createPolicedFetch` builds the
`fetch` port of a run from it; its `HttpClient` port sends one `GET` to the approved address and
follows no redirect itself. Nothing else in the package reaches the network, and a test scans the
sources to keep it so. See [security.md](security.md).

## Running a recipe

```
runRecipe(recipe, deps, executors) → { result: ok({ data, asOf }) | err({ code, step }), trace }
```

- `executors` maps every step kind to the one file that runs it (`StepExecutors`). The engine
  runs the steps in order, gives each the results of earlier steps by id, and stops at the
  first failure.

- `deps` are ports: `fetch`, `readEndpoint`, `clock`. `fetch` is the policed fetch of the
  egress policy, built by the caller. `readEndpoint` is built with `chainedEndpointReader` from
  the chain of endpoints whose runs led to this one: it refuses a read that loops back or nests
  more than two levels, and passes the longer chain to any run the read starts. The engine reads nothing else: no environment, no global
  clock, no randomness.
- A run is deterministic for the same recipe and the same responses.
- `trace` records, per step that ran, its id, kind, duration in milliseconds, fetched bytes and
  outcome. It never contains response bodies or values.
- The engine holds every step to the time limits with the clock port: a step that took longer
  than a step may, or ended after the run's budget, fails with `limit_exceeded`.
- `error` names the failing step and one code from a closed list kept in `packages/recipes`:
  `policy_denied`, `fetch_failed`, `fetch_timeout`, `too_large`, `unexpected_content`,
  `selector_empty`, `pattern_no_match`, `expression_failed`, `endpoint_unavailable`,
  `limit_exceeded`.

The engine returns raw data. The caller applies the output firewall: the gateway on every
refresh, and the planned builder on every trial run.

## Output spec and firewall

An endpoint's output spec is stored on the endpoint, not in the recipe, so a new recipe version
can never widen what leaves the system.

```json
{
  "schema": { "type": "object", "required": ["temperature_c"], "properties": { "temperature_c": { "type": "number" } }, "additionalProperties": false },
  "primary": "temperature_c",
  "unit": "°C",
  "sentence": "It is {temperature_c} °C in Vienna."
}
```

The firewall, `applyFirewall` in `packages/recipes`, validates the recipe result against
`schema` by walking the dialect itself: no dependency, no code generation. A result that does not match is not stored, not returned and not charged. The schema
dialect is a fixed subset: objects, arrays, strings, numbers, booleans, `required`, `enum`,
`minimum`, `maximum`, `maxLength`, `maxItems`; always `additionalProperties: false`. Property
names are lowercase snake_case. `primary` and every `{field}` of `sentence` must name a
top-level property. The dialect is the schema `outputSpecSchema` in `packages/contracts`.
A field that is not required may be absent but not `null`. A rejected value yields at most 20
violations, each a JSON Pointer path and the rule broken, never the value itself.

## Versions

- A recipe version is immutable. Fixing a recipe creates the next version.
- An endpoint has exactly one active version. Activation is one atomic update; rollback is
  activating the previous version.
- Every version stores the test report that justified it.
- The engine supports every document `version` that has an active recipe. Removing support for
  one requires migrating those recipes first.

## Testing recipes

- Engine and step tests replay recorded responses; no test touches the network.
- The recorded-response kit stores one file per source response (`Recording`: URL, status,
  media type and body text, nothing else). `createRecordedFetch` replays them and fails a test
  when a recipe requests anything that was not recorded. The package's `record` command
  captures a recording through the egress policy.
- The golden recipes (`src/golden/`) are hand-written recipes over approved sources, covering
  every step kind and one mix. Each carries its recordings and the value it must yield; a test
  runs each with `STEP_EXECUTORS` and the firewall, and Proof A runs them live.
- A live run happens only in proofs, in a running gateway, and in the planned builder's test
  stage.

## Extending the engine

Adding a step kind is one pull request that contains: the schema of the step, its executor (one
file), its limits, tests for success and every error code it can return, and its row in the
table above. A step kind never gets access to anything beyond the three ports.
