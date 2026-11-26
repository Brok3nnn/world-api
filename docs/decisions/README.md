# Decisions

Why the system is built the way it is. A decision record captures one choice between real
alternatives, so that it is not re-opened by accident. Records are short and numbered; a changed
mind is a new record that supersedes the old one.

## Accepted

| No. | Decision | Date |
| --- | --- | --- |
| [0001](0001-typescript-everywhere.md) | One language: TypeScript everywhere | 2026-11-22 |
| [0002](0002-monorepo.md) | One pnpm workspace monorepo of apps and packages | 2026-11-22 |
| [0003](0003-staged-hosting.md) | Start on one hosting platform; keep the gateway portable to edge isolates | 2026-11-22 |
| [0004](0004-database-and-auth.md) | One managed Postgres with auth and storage; typed schema; in-process database for tests | 2026-11-22 |
| [0005](0005-declarative-recipes.md) | Recipes are declarative documents; code recipes come later | 2026-11-22 |
| [0007](0007-core-first-scope.md) | Build the data API and AI-built endpoints first; everything else later | 2026-11-22 |
| [0008](0008-launch-catalog.md) | The first catalog is a mixed set of base APIs from open sources | 2026-11-22 |
| [0012](0012-recipe-expression-and-pattern-languages.md) | Recipe expressions are JSONata; recipe patterns run on a linear-time engine | 2026-11-22 |
| [0013](0013-commands-run-typescript-on-node.md) | Commands run TypeScript on Node's own type stripping, with one resolve hook | 2026-11-22 |

Numbers 0006 and 0009 to 0011 are not used here: they recorded the private development
workflow before this repository was published.

## Writing a record

Create `NNNN-short-name.md` with the next number, at most 80 lines, in this shape:

```
# NNNN — Title in the form of the decision

| Field | Value |
| --- | --- |
| Status | Proposed, Accepted, or Superseded by NNNN |
| Date | YYYY-MM-DD |

## Context
What forced a choice. Facts only.

## Decision
What we do, in one or two sentences, then the rules that follow from it.

## Consequences
What becomes easier, what becomes harder, what we must now always do.

## Alternatives considered
Each alternative in one line with the reason it lost.
```

Write a record when a choice constrains future work: a technology, a boundary, a contract rule,
a limit. Accepted records change only in their Status line; add the record to the table above
in the same pull request.
