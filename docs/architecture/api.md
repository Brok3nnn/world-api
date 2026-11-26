# Public data API

The contract of the consumer-facing API served by `apps/gateway`. It is read-only: every route
is a `GET`. The schemas in `packages/contracts` are the source of truth and generate
`packages/contracts/openapi.json`; this document explains them.

## Routes

| Route | Purpose | Status |
| --- | --- | --- |
| `GET /@{owner}/{slug}` | Current value of one endpoint | Built |
| `GET /search?q=` | Find endpoints in the catalog | Built |
| `GET /builds/{id}` | Status of a build | Built; builds are created by the planned builder |
| `GET /healthz` | Liveness of the gateway | Built |
| `GET /get?q=` | Universal entry: answer from the catalog, or start a build | Planned; its contract exists in `packages/contracts` |
| `GET /mix/{name}`, `GET /mix?sources=` | Several endpoints in one value | Planned |

`owner` matches `[a-z0-9_]{2,32}`; `slug` matches `[a-z0-9]+(-[a-z0-9]+)*`, at most 64
characters, read as sent: a percent-encoded character is not one of them. Anything else is
`400 invalid_request`. Any other path, and any method but `GET`, is `404 not_found`.

## Query parameters of an endpoint call

| Parameter | Values | Default | Meaning |
| --- | --- | --- | --- |
| `shape` | `json`, `number`, `text`, `csv` | `json` | Output shape |
| `max_age` | Whole seconds, 1 to one year | Endpoint freshness | Accept a value at most this old; an older one is refreshed first. A value below the endpoint's freshness interval is raised to it; a larger one accepts older values without a refresh |
| `max_price` | Whole credits, 0 to 1,000,000 | None | Cost cap; a more expensive answer returns `402` instead |

An endpoint has no parameters of its own: a different place, product or subject is a different
endpoint. Unknown parameters, and a parameter given twice, are rejected, not ignored. An error
names what to fix and never repeats what the caller sent.

## The envelope

Every successful `json` response has exactly these fields:

```json
{
  "data": { "temperature_c": 4.2 },
  "as_of": "2026-11-21T11:45:00Z",
  "sources": [
    {
      "name": "Example open weather service",
      "url": "https://example.org/docs/weather",
      "licence": "CC BY 4.0",
      "attribution": "Weather data: Example open weather service, CC BY 4.0"
    }
  ],
  "next_refresh": "2026-11-21T12:00:00Z",
  "method": "computed",
  "price_credits": 1
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `data` | Object | The value. Only fields of the endpoint's output spec |
| `as_of` | UTC instant | When the value was observed at the source |
| `sources` | Array, at least one | Every source that contributed: `name`, `url` (where it publishes its data), `licence` (short name) and `attribution`, the text its licence requires next to the value, or `null` when it requires none |
| `next_refresh` | UTC instant | Earliest time a newer value can exist |
| `method` | `computed`, `model-estimate`, `owner-data` | How the value was produced |
| `price_credits` | Integer | The price of this call in credits. Reported only; nothing is charged |

`sources` carries nothing else the registry keeps about a source: its terms, tier and review
date stay internal.

## Shapes

| Shape | Content type | Body | Requires in the output spec |
| --- | --- | --- | --- |
| `json` | `application/json` | The envelope | — |
| `number` | `text/plain` | The primary field as a bare number | A numeric primary field |
| `text` | `text/plain` | One sentence from the sentence template | A sentence template |
| `csv` | `text/csv` | Header row, then one row per item | Flat fields or one array of flat objects |

A shape the endpoint cannot produce, or that the current value cannot fill, returns
`400 invalid_request` with a hint naming the shapes it supports. `csv` lines end with a carriage
return and a line feed; a cell that contains a comma, a quote or a line break is quoted, with
quotes doubled. A `text` sentence never contains a missing field: if the value lacks one, the
call fails instead. The renderers are pure functions in `packages/core` (`shape/`). Non-JSON
shapes carry `as_of`, `next_refresh` and `price_credits` in the headers `x-as-of`,
`x-next-refresh` and `x-price-credits`.

## Errors

Every error is JSON with one stable machine code and what the caller should do:

```json
{ "error": { "code": "rate_limited", "message": "Too many calls.", "hint": "Retry after 12 seconds." } }
```

| Status | Code | When |
| --- | --- | --- |
| `400` | `invalid_request` | Malformed path, parameter or shape |
| `402` | `payment_required` | The answer costs more than `max_price`; checked before anything is refreshed, and the hint states the price |
| `404` | `not_found` | No such endpoint, build or route. A `private`, `building` or `disabled` endpoint gets the same answer, so its existence is not revealed |
| `429` | `rate_limited` | Too many calls; `retry-after` gives the seconds to wait |
| `500` | `internal_error` | A defect; the body has a generic message and no hint |
| `503` | `degraded` | The source failed and no acceptable value exists |

`hint` is present on every error except `internal_error`, whose request is identified by the
`x-request-id` header. The planned `/get` route adds `202 building` and `404 not_buildable`;
their bodies are already in the contracts.

## Headers

| Header | Meaning |
| --- | --- |
| `x-request-id` | Id of this call, on every response and in every log line |
| `cache-control` | `public, max-age=<seconds to next_refresh>` for public values; `public, max-age=60` for search pages; otherwise `private, no-store` |
| `retry-after` | Seconds: on `429`, until the next call is allowed; on `503`, one freshness interval of the endpoint |

API keys (`authorization: Bearer <key>`) are **Planned**; today every caller is anonymous and
rate-limited by address.

## Search

`GET /search?q=<words>` accepts `q` (1 to 200 characters), `limit` (1 to 50, default 20) and
`cursor`. It lists public endpoints that answer calls (`live` or `degraded`), best match first,
each with its permanent `url` on the origin the call came in on:

```json
{
  "items": [
    {
      "owner": "core",
      "slug": "topeka-weather",
      "title": "Weather in Topeka",
      "summary": "Latest observation at Topeka airport, Kansas: temperature, conditions, wind and humidity.",
      "url": "https://api.example.com/@core/topeka-weather",
      "price_credits": 1
    }
  ],
  "next_cursor": null
}
```

`next_cursor` is `null` on the last page; otherwise pass it back as `cursor`. Searching counts
towards the caller's rate limit.

## Build status

`GET /builds/{id}` returns `id`, `status` (`queued`, `running`, `succeeded`, `failed`,
`rejected`), `stage`, `progress` (0 to 1), `endpoint` (the URL once it succeeded) and `reason`.
All six fields are always present and the answer is never cached. Until the builder exists, no
build is ever created, so this route answers `404` for every id outside tests.

## Evolving the contract

- New routes, parameters, shapes and error codes are additive; removing or changing the meaning
  of anything needs a new major path prefix and a decision record. Version 1.0.0 is the first
  public release of this contract.
- `packages/contracts` exports one JSON example per response. The gateway's contract tests fail
  when a response stops matching its schema.
- `pnpm openapi` writes the OpenAPI 3.1 document from the schemas; `pnpm check` fails when the
  committed document no longer matches them.
