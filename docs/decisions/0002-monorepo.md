# 0002 — One pnpm workspace monorepo of apps and packages

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

The web app and the gateway are separate deployables that must agree exactly on contracts,
domain rules and the database schema. The builder and the recipe engine are used by more than
one app.

## Decision

One repository with pnpm workspaces: deployables in `apps/`, shared libraries in
`packages/`, each package with an explicit `exports` map and no build step.

- Layout and anatomy are fixed in [../architecture/repository.md](../architecture/repository.md).
- A package is created only for a hard boundary or a second consumer.

## Consequences

- A contract change and every consumer change land in one pull request.
- Boundaries are enforced by lint instead of by convention.
- Tooling (lint, types, tests, dead-code checks) is configured once at the root.

## Alternatives considered

- Separate repositories per app: independent history, but contracts drift and every change
  needs coordinated releases.
- One Next.js app containing everything: simplest today, but the hot path could not move to
  another runtime and boundaries would be conventions only.
