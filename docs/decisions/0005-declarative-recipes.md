# 0005 — Recipes are declarative documents; code recipes come later

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

An endpoint needs a repeatable way to produce its value without a model at call time. The
analysis proposed model-written program code run in isolation. Running arbitrary code needs a
paid sandbox from the first working version and carries the largest security risk in the
system.

## Decision

A recipe is a declarative document of steps executed by our own engine
([../architecture/recipes.md](../architecture/recipes.md)). The model writes the document, never
code.

- Version 1 offers fetch, select, match, read-endpoint and transform steps.
- The engine enforces the egress policy and all limits; a recipe can do nothing else.
- Code recipes are a reserved step kind (`code.run`) that will run in an isolated runtime when
  a source cannot be handled declaratively.

## Consequences

- Recipes are safe to run inside the gateway, portable to every runtime and replayable in
  tests.
- The system is provable end to end with no external sandbox.
- Some sources cannot be expressed in version 1; requests that need them are rejected until
  code recipes exist.
- New capabilities are added as step kinds, each a small reviewed unit.

## Alternatives considered

- Always generate code: handles any source, but needs a sandbox service immediately, is slower
  per refresh and far harder to make safe.
