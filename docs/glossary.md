# Glossary

The single name for every domain concept. Use the code name in identifiers, file names, tables
and documentation; use the UI word in copy. Never invent a synonym: if a concept is missing, add
it here first.

## Core concepts

| Code name | UI word | Meaning |
| --- | --- | --- |
| `endpoint` | API | One addressable piece of data: `GET /@owner/slug` returns its current value |
| `owner` | — | The account an endpoint belongs to; addressed by its `handle` (`@core`) |
| `handle` | handle | Unique, URL-safe account name, lowercase, `a-z0-9_` |
| `slug` | — | URL-safe endpoint name, unique per owner, lowercase kebab-case |
| `value` | value | The data an endpoint returns right now, validated against its output spec |
| `envelope` | response | The fixed JSON wrapper of every value: `data`, `as_of`, `sources`, `next_refresh`, `method`, `price_credits` |
| `shape` | format | How a value is rendered: `json`, `number`, `text`, `csv` |
| `output spec` | — | What an endpoint may return: a schema, its primary field, unit and sentence template |
| `output firewall` | — | The check that lets only output-spec fields leave the system |
| `freshness` | updates | How old a value may be before it is refreshed: `1m`, `5m`, `15m`, `1h`, `1d` |
| `refresh` | update | Running the recipe to replace a stale value |
| `method` | — | How a value is produced: `computed`, `model-estimate`, `owner-data` |
| `credit` | credit | The unit a price is reported in. Nothing is charged yet |

## Building

| Code name | UI word | Meaning |
| --- | --- | --- |
| `recipe` | — | A declarative document of steps that produces a value from sources, with no model at call time |
| `recipe version` | — | One immutable recipe of an endpoint; exactly one is active |
| `step` | — | One operation in a recipe: fetch, select, match, read another endpoint, transform |
| `engine` | — | The interpreter that runs a recipe under the egress policy and limits |
| `build` | build | One run of the builder agent for one request |
| `build spec` | — | The structured reading of a request: fields wanted, shape, freshness, source count |
| `builder` | — | The planned agent pipeline that turns a request into a tested, published endpoint |
| `stage` | step | One phase of a build: interpret, discover, check policy, draft, test, publish |
| `trial run` | test run | One execution of a draft recipe during the test stage |
| `repair` | self-healing | A build that replaces a broken recipe with a new version |
| `mix` | mix | An endpoint whose recipe reads other endpoints and returns them as one value |

## Supply and compliance

| Code name | UI word | Meaning |
| --- | --- | --- |
| `source` | source | An origin of data with a recorded licence and policy |
| `source registry` | — | The table of approved sources the builder may use |
| `tier` | — | Compliance class of a source: `green` cleared, `yellow` conditional, `red` blocked |
| `attribution` | sources | The text a licence requires next to a value, or none; returned in `sources` with the source's name, URL and licence |
| `terms` | — | The conditions read in a source's terms when it was approved; kept in the registry, never returned |
| `catalog endpoint` | — | An endpoint owned by the platform account `@core`, built from open data |
| `built endpoint` | — | An endpoint created by the builder for a requester, who becomes its owner (planned) |
| `owner-data endpoint` | — | An endpoint fed by its owner's own source (sensor, camera, file, key) (planned) |
| `publisher` | publisher | An account that owns at least one public endpoint |
| `visibility` | visibility | `private` (owner only), `unlisted` (anyone with the link), `public` (listed) |
| `category` | category | Where an endpoint is listed: `weather`, `environment`, `wildlife`, `finance`, `energy`, `transport`, `developer`, `knowledge`, `places`, `commerce`, `jobs` |
| `status` | status | Endpoint state: `building`, `live`, `degraded`, `disabled` |

## Serving and accounting

| Code name | UI word | Meaning |
| --- | --- | --- |
| `gateway` | — | The app that answers the public data API |
| `caller` | — | Whoever makes a call: anonymous, or an account identified by an API key |
| `port` | — | An interface the core depends on; implemented by an adapter |
| `adapter` | — | One implementation of a port for a concrete technology |
| `usage event` | call | One recorded call: endpoint, caller, outcome, price, latency |
| `proof` | — | A runnable scenario that shows the system works end to end against live sources, with a saved report |

## Naming rules that follow from this

- UI copy says "API", "format", "updates"; code says `endpoint`, `shape`, `freshness`.
- A function that creates an endpoint from a request is `build…`; one that re-runs a recipe is
  `refresh…`; one that fixes a recipe is `repair…`. Do not use `generate`, `sync`, `update` for
  these.
- `source` is never called "provider" or "integration"; `recipe` is never called "script",
  "scraper" or "workflow".
- Time fields end in `_at` (instants) or `_s` (durations in seconds).
