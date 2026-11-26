# 0013 — Commands run TypeScript on Node's own type stripping, with one resolve hook

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

Proofs, the response recorder and the gateway's Node entry run TypeScript outside the test
runner and outside the web app's bundler. Packages
are shipped as TypeScript and import each other's files without extensions, as the bundler
resolution of `tsconfig.base.json` allows. Node 24 runs `.ts` files by stripping their types,
but only syntax that can be erased, and its resolver needs file extensions.

## Decision

A command is a package script that runs `node --import <root>/scripts/resolve-ts.mjs <file>.ts`.
Node strips the types; the hook, about 15 lines, adds `.ts` to a relative import that has no
extension. No runner and no build step are added.

- `tsconfig.base.json` sets `erasableSyntaxOnly`, so the compiler refuses what Node cannot
  strip: enums, namespaces, parameter properties. Every workspace already complies.
- The hook is the only change to how modules resolve. It is a repository tool in `scripts/`.
- Node 24 or later stays required.

## Consequences

- The files the tests import are the files the commands run; nothing is compiled twice.
- No dependency with native binaries is added for running scripts.
- The hook uses `module.registerHooks`, a Node API that is not yet final. If it changes, one
  file changes.
- The gateway's Node entry, the recorder and the proofs run this way.

## Alternatives considered

- A TypeScript runner package: a new dependency, with a native compiler binary.
- Compiling to JavaScript before running: a build step and output folders for every package.
- Running commands through the test runner: misuses a test tool and its reporting.
- Writing `.ts` extensions in every import: rewrites every import in the repository.
