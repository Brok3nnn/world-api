# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-26

First public release.

### Added

- `apps/gateway`: a framework-free `Request` → `Response` data API with the routes
  `/@{owner}/{slug}`, `/search`, `/builds/{id}` and `/healthz`, built from ports with memory and
  Postgres adapters.
- `pnpm dev:gateway`: the gateway on Node against an in-process Postgres (PGlite), migrated and
  seeded with six catalog endpoints that refresh from live public sources on demand.
- `packages/recipes`: the declarative recipe engine with five step kinds, an egress policy with
  address pinning, an output firewall, and a sandboxed JSONata and RE2 evaluator.
- `packages/contracts`: Zod contracts for every wire format and the generated OpenAPI 3.1
  document, with a drift check.
- `packages/core`: pure rules for freshness, grace and degradation, shapes, statuses, pricing
  and ids.
- `packages/db`: the Drizzle schema, eight SQL migrations, query modules and the seed, including
  a source registry that records each source's licence, attribution and terms.
- `apps/web`: a Next.js design prototype of the product on typed sample data, marked as such on
  every page.
- Envelope `sources` as one object per source: `name`, `url`, `licence` and the attribution its
  licence requires.
- Documentation, decision records, live proof reports, CI on Node 24 with pnpm 11.28.6, and the
  community files.
