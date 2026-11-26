# Repository structure

Where every file goes. The layout is a pnpm workspace monorepo
([decision 0002](../decisions/0002-monorepo.md)). If a file has no obvious home here, the
structure is missing something: update this document in the same pull request, never drop the
file into the nearest folder.

## Top level

```
README.md  LICENSE  CHANGELOG.md     What this is, how to run it, its licence and releases
CONTRIBUTING.md  CODE_OF_CONDUCT.md  SECURITY.md
.github/                             CI workflow, Dependabot, issue and pull request templates
apps/
├── web/                             Next.js design prototype (see web.md)
└── gateway/                         Public data API (see gateway.md)
packages/
├── contracts/                       Wire formats: schemas and their types
├── core/                            Pure rules and primitives
├── recipes/                         Recipe engine, egress policy, output firewall
└── db/                              Schema, migrations, queries, seed
docs/                                This documentation
scripts/                             Repository tooling run by package scripts
biome.json  knip.json  tsconfig.base.json  pnpm-workspace.yaml  package.json  pnpm-lock.yaml
.gitignore  .editorconfig            Ignore rules; editor defaults
.env.example                         Names of every configuration variable; the template of `.env`
```

Nothing else lives at the top level. No `src/` at the root, no `lib/`, `shared/`, `common/`,
`utils/` or `misc/` anywhere.

## Package anatomy

Every package under `packages/` has exactly this shape:

```
packages/<name>/
├── package.json          name "@repo/<name>", "private": true, explicit "exports" map
├── tsconfig.json         extends ../../tsconfig.base.json
├── vitest.config.ts      test files, coverage always on, thresholds for this package
├── README.md             purpose, entry points, what it must never do (≤ 60 lines)
└── src/
    └── <module>/         one folder per cohesive module, kebab-case
        ├── <thing>.ts
        ├── <thing>.test.ts
        └── testing/      test doubles this module offers to its consumers (optional)
```

- **Entry points are explicit.** `exports` lists one subpath per module file that other packages
  may import: `"./envelope": "./src/envelope/envelope.ts"`, or `"./time/clock":
  "./src/time/clock.ts"` when a module has several public files. Anything not listed is
  private. There are no barrel files and no `index.ts`.
- **Source is shipped as TypeScript.** Consumers compile packages; there is no package build
  step. The web app's bundler compiles workspace packages by itself, so an app only declares
  the package as a `workspace:*` dependency.
- **A module is a folder with one job.** It holds at most 12 source files. When it needs more,
  it is two modules.
- **A new package needs a reason:** a hard boundary (it must not see something) or two
  consumers. Otherwise the code belongs in an existing package or in the app that uses it.
- **A new workspace declares its layer.** It gets a `noRestrictedImports` override in
  `biome.json` naming what it may import, a workspace entry in `knip.json`, and its place in
  the layer diagram of [overview.md](overview.md).

## App anatomy

`apps/web` is described in [web.md](web.md). `apps/gateway` has this shape:

```
apps/gateway/src/
├── app.ts                 createApp(deps): builds the HTTP app from its ports
├── env.ts                 The only reader of configuration
├── routes/                One file per route; thin: parse, call the pipeline, respond
├── pipeline/              One file per stage of serving a call
├── responses/             Response builders shared by routes and stages (the error body)
├── ports/                 One interface per file; no implementation
├── adapters/
│   ├── engine/            The recipe runner over @repo/recipes
│   ├── postgres/          Ports implemented with @repo/db
│   ├── memory/            Ports implemented in memory (single-process locks and limiters, tests)
│   └── stdout/            The JSON-lines logger
├── catalog/               Tests of the seeded catalog over recorded responses
├── proof/                 Proof B and its report
└── entry/
    ├── local-gateway.ts   The local composition: seeded database, Postgres adapters, engine
    ├── node-server.ts     Node's HTTP server adapted to the Web-standard app
    └── node.ts            The Node entry of `pnpm dev:gateway`
```

Stage 2 would add an `adapters/edge/` folder and a worker entry; neither exists.

## Naming

| Thing | Rule | Example |
| --- | --- | --- |
| Folders and files | kebab-case, names the single thing inside | `read-value.ts`, `egress-policy.ts` |
| Tests | Same name plus `.test.ts`, next to the source | `read-value.test.ts` |
| Test doubles | `fake-<port>.ts` in a `testing/` folder | `testing/fake-value-store.ts` |
| Ports | Noun, the capability | `value-store.ts` exports `ValueStore` |
| Adapters | `<technology>-<port>.ts` | `postgres-value-store.ts` |
| Database tables | `<table>-table.ts` in `packages/db/src/schema/` | `accounts-table.ts` |
| Pipeline stages | Verb first | `resolve-endpoint.ts`, `render-shape.ts` |
| Schemas | The thing, plus `Schema` for the value | `envelopeSchema`, type `Envelope` |
| Packages | One word where possible | `@repo/recipes` |

Forbidden names anywhere: `utils`, `helpers`, `common`, `misc`, `temp`, `new-*`, `old-*`,
`*2`, `index` (except where a framework requires it), `types` as a package or folder that
collects unrelated types.

Ignore rules name build output only at the places a tool writes it (`apps/*/build`, never
`build/` anywhere), so a source folder may be called `build`, `out` or `dist`. The structure
check fails when any file in a source folder is ignored by Git: a passing gate with files
missing from the commit must not be possible.

## Where does this go?

| You are adding | It goes in |
| --- | --- |
| A field, parameter or error of the public API | `packages/contracts`, then [api.md](api.md) |
| A rule with no I/O (is it stale, what does it cost, how is it rendered) | `packages/core` |
| A recipe step kind or an engine limit | `packages/recipes`, then [recipes.md](recipes.md) |
| A table, column or query | `packages/db`, then [data-model.md](data-model.md) |
| A route of the data API | `apps/gateway/src/routes` plus a pipeline stage if it adds logic |
| A new external system | A port where it is needed, an adapter in the app that wires it |
| A page or component | `apps/web`, following [web.md](web.md) |
| A repository tool | `scripts/`, wired to a script in the root `package.json` |
| A one-off experiment | Nowhere. Do not commit experiments |

## Root tooling

| File | Purpose |
| --- | --- |
| `package.json` | Workspace scripts only: `dev:gateway`, `dev:web`, `check`, `test`, `verify`, `proof:*` and the single checks |
| `pnpm-workspace.yaml` | Workspace globs `apps/*`, `packages/*` |
| `tsconfig.base.json` | Strict compiler options shared by every workspace |
| `biome.json` | One lint and format configuration for the whole repository |
| `knip.json` | Dead-code detection per workspace |
| `scripts/check-structure.mjs` | Enforces document sizes, link integrity, folder sizes and that no source file is ignored |
| `scripts/check-migrations.mjs` | Fails when the database schema changed without a migration |
| `scripts/openapi.mjs` | Writes `packages/contracts/openapi.json`, or checks that it is current |
| `scripts/resolve-ts.mjs` | Lets Node run TypeScript commands as they are ([decision 0013](../decisions/0013-commands-run-typescript-on-node.md)) |

Dependencies are declared in the workspace that imports them. The root declares tooling only.
A new dependency is added deliberately: state in the pull request what it replaces, why existing
code cannot cover it, and that it runs on both gateway runtimes if the gateway imports it.

## What exists

`apps/web`, `apps/gateway`, `packages/contracts`, `packages/core`, `packages/recipes` and
`packages/db` exist. A `packages/builder` workspace for the planned builder agent would sit beside
`packages/db` and never import it; it is not created until there is code for it.
