# Product

World API (a working name) is a real-world data API: anyone, a person or an AI agent, gets a
real-world value with a single `GET` call, in the shape they ask for. This document describes
the product idea and marks what exists today. Every domain term has one name, defined in
[glossary.md](glossary.md).

## Scope

The core is built first ([decision 0007](decisions/0007-core-first-scope.md)):

1. **Built.** One `GET` call returns the current value of a catalog endpoint, in the requested
   shape, refreshed from approved public sources through a declarative recipe.
2. **Planned.** A plain-language request for data that does not exist yet is turned by the
   builder agent into a tested endpoint, built only from approved sources.
3. **Prototype.** The web app shows the whole product as a design on typed sample data; it does
   not call the API yet.

Accounts, API keys, billing, publishing one's own data, the agent server and community features
are **Planned**: the gateway has the stages and ports where they plug in, but none is built.

## Audience

1. **Developers who build with AI coding tools.** They do not want to read API docs, juggle
   provider keys or maintain scrapers; their tool should wire the data up on the first try.
2. **AI agents**, which need one stable response format and a cost cap per call.
3. **Data owners** with a camera, a sensor, research data or an inventory system who want to
   share it as an API (planned).

## Supply layers

| Layer | What it is | Status |
| --- | --- | --- |
| Catalog | Ready endpoints over licensed open data, owned by the platform account `@core` | Built: six endpoints |
| Built on demand | When requested data does not exist, the builder agent assembles it from approved sources and keeps it fresh | Planned |
| Own data | An owner's own source (camera, sensor, spreadsheet, existing API) with an owner-defined output | Planned |

## Anatomy of a call

```
GET http://127.0.0.1:8787/@core/topeka-weather
{
  "data": { "station": "Topeka, Philip Billard Municipal Airport", "conditions": "Clear",
            "temperature_c": 9, "wind_kmh": 29.6, "humidity_percent": 46 },
  "as_of": "2026-11-22T20:20:00.000Z",
  "sources": [{ "name": "National Weather Service API",
                "url": "https://www.weather.gov/documentation/services-web-api",
                "licence": "Public domain (U.S. Government work)", "attribution": null }],
  "next_refresh": "2026-11-22T21:22:00.000Z",
  "method": "computed",
  "price_credits": 1
}
```

The JSON envelope is always the same: `data`, `as_of`, `sources`, `next_refresh`, `method`,
`price_credits`. Tools learn it once. The full contract is in
[architecture/api.md](architecture/api.md).

## Output shapes (`?shape=`)

| Shape | Returns | Good for |
| --- | --- | --- |
| `json` (default) | The envelope above | Agents and programs |
| `number` | The primary field as a bare number | Spreadsheets, displays, simple decisions |
| `text` | One sentence from the endpoint's template | People, chat |
| `csv` | A header and rows | Time series, analysis |

Probability answers to a question about a value were part of the original idea; they need a
model at call time and are **Planned** only, not part of the contract.

## Freshness and failure

- Each endpoint has a freshness class (1 minute to 1 day). Nothing refreshes without a call; a
  stale value is refreshed once, however many calls arrive at the same time.
- When a source fails, the last value is served within a grace period; after that the endpoint
  is `degraded` and the call is answered with `503` and never charged.
- **Planned:** self-healing, where the builder rewrites a broken recipe, tests it and restores
  the endpoint.

## Mixes

A mix is an endpoint whose recipe reads other endpoints (`endpoint.read`) and combines them;
`@core/weather-difference` is one. **Planned:** `/mix` routes for saved and ad-hoc mixes.

## Price

Every endpoint has a price in credits, computed from what its recipe reads, and every call
reports it in `price_credits`. A caller can cap the price with `max_price`. **Nothing is
charged**: accounts, balances and billing are planned, and no price list is defined.

## Trust and compliance

- Every source is recorded with its licence, the attribution it requires, the terms read when
  it was approved, and the date of that check. A check older than 90 days stops the source from
  being used until it is renewed.
- Only factual data from sources whose terms permit automated access and reuse; nothing behind
  a login.
- `method` marks how a value was produced; `model-estimate` is reserved for model-written
  values, which no endpoint produces today.

## Planned beyond the core

| Capability | Idea |
| --- | --- |
| Builder agent | Interpret a request, find approved sources, draft and test a recipe, publish a private endpoint ([architecture/builder.md](architecture/builder.md)) |
| Accounts and keys | Sign-in, hashed API keys, per-key limits, private endpoints |
| Own data | Push, pull, file and existing-API connections, with server-enforced output rules |
| Agent server | One MCP server with two tools, `search` and `get` |
| Community | Likes, rankings from usage and quality, a request board |
| Quality signals | Uptime, latency, freshness and schema stability per endpoint |
