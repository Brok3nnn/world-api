# 0012 — Recipe expressions are JSONata; recipe patterns run on a linear-time engine

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

Recipe version 1 carries two small languages: the expressions of `transform` and `as_of`, and
the patterns of `text.match`. Whatever the engine accepts becomes part of every stored recipe
and of what the planned builder's model must write, so changing it later means migrating
recipes.

- Expressions must be pure: no I/O, no code generation at runtime, no reach into globals, a
  time and a depth limit, and they must run on Node and on edge isolates.
- Patterns may be written by a model and run against untrusted source text. The built-in regular
  expressions backtrack, some patterns take exponential time, and JavaScript cannot interrupt a
  running match. A length cap alone does not bound the time.

## Decision

Expressions are written in JSONata and evaluated by the `jsonata` package. Patterns use RE2
syntax and are evaluated by `re2js`, a pure-JavaScript port of RE2 that matches in linear time.
Both are MIT-licensed and have no dependencies of their own.

- One wrapper module per library in `packages/recipes`; no other file imports either library.
- An expression sees only the step results bound by id. The functions that read the clock or
  randomness are rebound or disabled, so a run stays deterministic.
- The wrapper enforces the time and depth limits of `recipes.md`. If a library cannot honour a
  limit or a rule above, a new record replaces this one.
- RE2 has no backreferences and no lookaround; recipes cannot use them, and the builder's draft
  prompt must say so.
- Both are pinned to an exact version. An upgrade is its own pull request, tested by the golden
  recipes.

## Consequences

- A model can write two languages with public references, and expressions stay short: the
  example in `recipes.md` is already JSONata.
- No pattern can hang a refresh, whatever the model or the source sends.
- Two dependencies sit on the hot path of the gateway and are judged by its portability rules.
- `evaluate-expression.ts` and the `text.match` step wrap the libraries and prove these rules
  with tests.

## Alternatives considered

- JMESPath: no arithmetic in the standard language.
- JSON Logic: deep JSON trees that are hard for a model to write and for people to read.
- An own expression language: more to build, test and document, and no public reference.
- JavaScript in a sandbox: that is code, which decision 0005 leaves to `code.run`.
- Built-in regular expressions with an input cap: the cap does not bound backtracking time.
