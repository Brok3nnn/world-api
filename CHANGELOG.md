# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `pnpm dev:gateway` no longer stops on a request the Fetch API cannot represent, such as `TRACE`
  or a malformed `Host` header: it answers `400 invalid_request` with a request id.
- `csv` columns follow the order of the endpoint's output spec instead of the key order of
  Postgres `jsonb`.
- `GET /search` answers a query with a NUL character with `400 invalid_request` instead of `500`.
- `pnpm test` passes in a checkout whose path contains a space.
- The `429` hint says "1 second", not "1 seconds".

### Changed

- A `503 degraded` caused by a source whose terms check is over 90 days old says that retrying
  does not help, instead of "Try again later".
- The web prototype lists its made-up endpoints under `@sample` instead of the real `@core`,
  counts "sample APIs", and its notice and docs page say which features are planned.
- `next dev` no longer writes `apps/web/AGENTS.md` when an AI coding agent runs it.
- Dependencies: PGlite 0.6, React 19.3.1, Tailwind CSS 4.3.5, lucide-react 1.79, knip 6.48 and
  shadcn 4.23.1.

### Security

- Recipe expressions can no longer call JSONata's `$shuffle`, which brought randomness into a
  run.
- Dependencies of development and build tools: minimatch 11.0.9 (GHSA-g3hv-75wg-m249) through
  shadcn 4.23.1, and esbuild 0.25.12 for drizzle-kit's `@esbuild-kit/core-utils` through a
  scoped pnpm override (GHSA-67mh-4wv8-2f99).

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

[Unreleased]: https://github.com/Brok3nnn/world-api/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Brok3nnn/world-api/releases/tag/v1.0.0
