# 0008 — The first catalog is a mixed set of base APIs from open sources

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

The catalog must not be empty at launch. The owner chose breadth over a single vertical: a few
endpoints from every main category.

## Decision

Seed about 30 catalog endpoints across weather, environment, finance, developer data, knowledge,
places, news and jobs, built only from sources whose licence permits commercial reuse and
automated access.

- Every source is recorded in the source registry with licence, attribution, evidence and tier
  before any endpoint uses it.
- The first endpoints are written by hand to prove the engine and the gateway; six exist. The
  rest are to be produced by the planned builder as its acceptance test.
- Social networks, marketplaces and booking sites are out of scope.

## Consequences

- Each category needs its own licence review; the registry seed is real work.
- The builder is exercised on varied sources early.
- Attribution required by a licence appears in responses as data, in `sources`.

## Alternatives considered

- Environment and field data only: legally cleanest and closest to the own-data story, but
  narrower than the owner wants at launch.
