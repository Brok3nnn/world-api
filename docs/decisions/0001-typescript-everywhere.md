# 0001 — One language: TypeScript everywhere

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

The system has a web app, a public data API on a hot path, a planned agent pipeline and
background jobs, maintained by one developer with AI-assisted tooling. The hot path is dominated
by cache and network time, not by computation, and its target runtime (edge isolates) runs
TypeScript natively.

## Decision

All apps and packages are written in strict TypeScript. No second language is introduced for
any service.

- Wire formats are defined once as schemas and shared by every app.
- A different language is allowed only inside an isolated sandbox for future code recipes, and
  only for the recipe's own program.

## Consequences

- One toolchain, one set of conventions and one type system across the whole repository.
- The gateway can move between runtimes without a rewrite (decision 0003).
- CPU-heavy work must be kept off the hot path by design, not by language.
- If one component ever becomes a measured bottleneck, it can be replaced behind its HTTP or
  port boundary by a new decision record.

## Alternatives considered

- Go for backend services: fast and simple, but two languages, duplicated contracts, and no
  path to edge isolates.
- Rust for the gateway: highest performance, but slower delivery and harder maintenance for a
  path that is not CPU-bound.
- Python for the backend: strong data libraries, but slower on the hot path and not available
  on the target runtime.
