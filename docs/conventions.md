# Conventions

How code is written in every workspace, and which of these rules a tool enforces. Biome
(`biome.json`), TypeScript, Knip and `pnpm structure:check` enforce what they can; the rest is
for review. Tests have their own document, [testing.md](testing.md).

## Size limits

Every unit stays small enough to be read, replaced and reviewed whole. Reaching a limit means a
unit does two things: split it, never compress it or switch the rule off.

| Unit | Limit | Enforced by |
| --- | --- | --- |
| Source file `.ts` | 250 lines, blank lines not counted | Biome `noExcessiveLinesPerFile` |
| Component file `.tsx` | 200 lines | Biome override for `**/*.tsx` |
| Test file | 400 lines | Biome override for `**/*.test.*` |
| Function body | 60 lines (components 100) | Biome `noExcessiveLinesPerFunction` |
| Cognitive complexity | 15 per function | Biome `noExcessiveCognitiveComplexity` |
| Positional parameters | 3; beyond that one options object | Biome `useMaxParams` |
| Line width | 100 characters | Biome formatter |
| Barrel files, `export *`, import cycles | None | Biome `noBarrelFile`, `noReExportAll`, `noImportCycles` |
| `any`, non-null `!`, `@ts-ignore` | None | Biome and TypeScript |
| Reads of the environment | Only in `env.ts` files | Biome `noProcessEnv` |
| Files directly in one folder | 25 (`public/` and `migrations/` excepted) | `pnpm structure:check` |
| Source files ignored by Git | None | `pnpm structure:check` |
| Documents | 250 lines; the root README 400; decision records 80; package READMEs 60 | `pnpm structure:check` |

Typed fixture data, recorded source responses, generated files and migrations are exempt from
the file limit. The override list in `biome.json` is the complete set of exceptions; product
code has no `biome-ignore` comments.

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Files and folders | kebab-case, naming the single thing inside | `read-value.ts`, `endpoint-card.tsx` |
| Functions | camelCase, verb first | `buildEnvelope`, `formatCredits` |
| Types and components | PascalCase, no `I`/`T` prefix | `ServedEndpoint`, `EndpointCard` |
| Module-level tables | SCREAMING_SNAKE_CASE | `RUN_LIMITS`, `LOG_EVENTS` |
| Schemas | The thing plus `Schema`; the type is derived | `envelopeSchema`, `Envelope` |
| Ports and adapters | Noun for the capability; `<technology>-<port>` | `ValueStore`, `postgres-value-store.ts` |
| Pipeline stages | Verb first | `resolve-endpoint.ts`, `render-shape.ts` |
| Test doubles | `fake-<port>.ts` in a `testing/` folder | `testing/fake-recipe-runner.ts` |

Names use the domain words of [glossary.md](glossary.md). No `utils`, `helpers`, `common`,
`misc` or `temp` files or folders.

## TypeScript

- `strict` with `noUncheckedIndexedAccess` and `erasableSyntaxOnly`: no enums, namespaces or
  parameter properties, so Node can run the source as it is
  ([decision 0013](decisions/0013-commands-run-typescript-on-node.md)).
- Named exports only; default exports only where Next.js or a tool requires them.
- `import type` for type-only imports. Inside a package, relative imports; across packages,
  only the entry points listed in a package's `exports` map.
- `as` only at a documented boundary, with a one-line comment saying why it is safe.
- Exhaustive `switch` over unions with no `default`, so a new member fails the build.
- Domain values are unions (`"live" | "degraded"`), not booleans or loose strings.
- No nested ternaries; guard clauses first, the main path last.

## Server-side code

Every function is one of three kinds; a function that mixes kinds is split.

| Kind | May do | May not do | Lives in |
| --- | --- | --- | --- |
| Pure | Compute from its arguments | I/O, clock, randomness, configuration, logging | `packages/contracts`, `packages/core`, most of `packages/recipes` |
| Orchestration | Call pure code and ports in order | Know which technology is behind a port | Gateway pipeline and routes |
| Adapter | Talk to one external system | Contain business rules | `adapters/`, `packages/db` queries |

- **Ports and adapters.** A port is an interface declared by the code that needs it, one per
  file, speaking domain types. An adapter implements one port for one technology. Adapters are
  chosen only in a composition root (an entry file); dependencies arrive as one `deps` argument,
  with no singletons, service locators or injection framework.
- **Errors.** Expected outcomes are values: `Result<Value, Failure>` from `packages/core`, where
  `Failure` is a closed union with a `code`. Exceptions are for defects only, and the gateway
  turns them into one `500 internal_error` at its outer boundary. Messages never contain
  secrets, values or raw input.
- **Validation.** Data is parsed once, where it enters (a request, a JSON column, a source
  response, the environment), with a schema from `packages/contracts`. Inside, types are trusted.
  Ids are branded types, so an endpoint id cannot be passed where a build id is expected.
- **Time and randomness.** Only adapters read the system clock or generate randomness; everything
  else takes the `Clock` and `RandomSource` ports, so every run is reproducible in a test.
  Instants are UTC; durations are integer seconds or milliseconds named with their unit.
- **Money.** Integers only: prices in credits, amounts in micro-dollars. No floating point.
- **Database access.** Only `packages/db` talks to the database. A query takes the handle first,
  binds every parameter and returns plain typed data. No query runs in a loop, and every list is
  paginated.
- **Outbound calls.** Every call has a timeout and a size cap and treats the response as hostile.
  Recipes fetch only through the egress policy.
- **Concurrency.** Assume any function can run twice at once on two instances: shared state is
  behind a port, guarded by a lock or a unique constraint, and repeatable writes are idempotent.
- **Logging.** Through the `Logger` port, with a named event and typed fields; never values,
  query text, keys or addresses. See [architecture/operations.md](architecture/operations.md).

## React and the web prototype

- Server components by default; `"use client"` only on the smallest leaf that needs state,
  effects or browser APIs. The React Compiler is on, so no `useMemo`/`useCallback` by default.
- One component per file, props interface `<Component>Props` above it, `className` merged with
  `cn()`. Base UI composition uses the `render` prop.
- Shareable state lives in the URL through a feature's `search-params.ts`; local state uses
  `useState`; there is no global store.
- Reads go through `features/<feature>/data/queries.ts`, the only importer of fixtures.
- Tailwind utilities with the tokens of [design-system.md](design-system.md); no raw colours.
  Every page works at 375 px wide.
- Accessibility: semantic elements, one `h1` per page, an accessible name on every control,
  visible focus, `prefers-reduced-motion` respected, and colour never the only signal.

## Comments and copy

- Comments say why, not what. Exported functions whose purpose is not obvious from the name get
  a short doc comment. No commented-out code and no `TODO` without a reason.
- UI copy is English, sentence case, plain and concise, with no hype.

## Dependencies

Dependencies are declared in the workspace that imports them; the root declares tooling only. A
new dependency needs a reason existing code cannot cover, and the gateway accepts only
dependencies that run on both Node and edge runtimes (no native bindings, no code generation at
runtime).
