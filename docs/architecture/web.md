# Web app

Structure of `apps/web`, the Next.js app: catalog, endpoint pages, the request and publish
flows, and the account area. All paths in this document are relative to the web app root,
`apps/web/`. The system around it is in [overview.md](overview.md).

**It is a design prototype on typed sample data.** No page calls the gateway or a database:
every screen reads fixtures through its feature's `data/queries.ts`. Endpoints, statistics,
publishers and credit balances are fictional; sign-in is simulated in the browser
(`useSession`, `localStorage`), and API keys are random strings that authenticate nothing. An
amber notice (`components/layout/prototype-notice.tsx`) says so on every page. The prototype
also shows features the API does not have, such as probability answers, mixes and `/get`.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, React Compiler, Cache Components, Partial Prefetching, typed routes |
| Language | TypeScript, strict, `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4, design tokens in `src/app/globals.css` |
| Components | shadcn/ui on Base UI (`@base-ui/react`), icons from `lucide-react` |
| URL state | `nuqs` |
| Toasts | `sonner` |
| Lint and format | Biome |
| Dead-code detection | Knip |
| Package manager | pnpm |

## Folder structure

```
public/
└── covers/                              Cover photos, one JPG per CoverId (see ../assets.md).
src/
├── app/                                 Routes only. Thin: load data, compose feature components.
│   ├── layout.tsx                       Root: fonts, metadata, providers.
│   ├── globals.css                      Design tokens (see ../design-system.md).
│   └── (platform)/                      Everything inside the app shell.
│       ├── layout.tsx                   Shell: top header, mobile nav, command menu.
│       ├── page.tsx                     /                 Request composer + catalog strip
│       ├── marketplace/page.tsx         /marketplace      Catalog with search, filters, sort
│       ├── marketplace/[publisher]/[slug]/page.tsx        Endpoint detail
│       ├── community/page.tsx           /community        Trending, new, requests, publishers
│       ├── search/page.tsx              /search           Full search results
│       ├── create/page.tsx              /create           Request an API / publish own data
│       ├── my-apis/page.tsx             /my-apis          Owner dashboard
│       ├── publishers/[handle]/page.tsx /publishers/:id   Public profile (also the viewer's own)
│       ├── settings/page.tsx            /settings         Profile, API keys, notifications, credits
│       └── docs/page.tsx                /docs             Single-page reference
├── components/
│   ├── ui/                              shadcn/ui primitives. Generated, then owned.
│   ├── shared/                          Product-agnostic building blocks used by 2+ features.
│   └── layout/                          App-shell pieces (sidebar, mobile nav, providers).
├── config/                              site.ts (product constants), navigation.ts
├── features/
│   └── <feature>/
│       ├── components/                  Feature UI, one component per file.
│       ├── data/
│       │   ├── queries.ts               Server-only reads. The only reader of fixtures or the database.
│       │   ├── mutations.ts             Server Actions of the feature (added when it writes).
│       │   └── fixtures/                Typed sample data until the feature reads the database.
│       ├── hooks/                       use-*.ts client hooks.
│       ├── lib/                         Pure functions, no React.
│       ├── constants.ts                 Labels, option lists, lookup tables.
│       ├── types.ts                     Domain types.
│       └── search-params.ts             URL contract of the feature's page (nuqs parsers).
├── lib/                                 Cross-feature pure helpers (format, text-search, object).
└── types/                               Global type augmentations only (*.d.ts).
```

Features today:

| Feature | Owns |
| --- | --- |
| `catalog` | Endpoint domain: types, fixtures, queries, URLs, filtering, and the endpoint display components reused everywhere |
| `marketplace` | The catalog browsing page and the endpoint detail page |
| `builder` | Request composer, request-an-API flow, publish-your-data flow (`/create`) |
| `community` | Trending, new, requests and publisher rankings |
| `search` | `/search` and the global command menu |
| `dashboard` | Owner dashboard (`/my-apis`) |
| `account` | The viewer, the client session (`useSession`), log in / sign up dialog, header account menu, `AuthGate`, settings |
| `publishers` | Public profile pages |
| `docs` | Single-page reference (`/docs`) |
| `home` | Home hero composition |
Create a sub-folder only when it has content; do not pre-create empty folders.

## Dependency rules

```
app ──► features ──► components ──► lib, config
             │            ▲
             └────────────┘ (features use shared components and ui)
```

- `app/` may import from anything. Route files stay thin: no business logic, no large JSX trees.
- `features/<a>` may import `components/`, `lib/`, `config/` and specific files of another feature
  (`@/features/catalog/lib/endpoint-urls`). No import cycles between features.
- `components/` and `lib/` never import from `features/`.
- No barrel files (`index.ts` re-exports). Import the file that defines the thing.
- Inside a feature use relative imports (`../types`); across folders use the `@/` alias.

## Data flow

1. A route (server component) calls `features/<feature>/data/queries.ts`.
2. It passes plain, serializable props to feature components.
3. Client components (`"use client"`) handle interaction only. They never import `queries.ts`
   (enforced by `server-only`).
4. Shareable UI state (search query, filters, tabs, builder settings) lives in the URL through the
   feature's `search-params.ts`. Other links into that page use its serializer
   (`builderUrl`, `searchUrl`), never hand-built query strings.
5. Ephemeral UI state uses `useState`. There is no global state library; per-browser preferences
   such as likes use a small `useSyncExternalStore` hook.

## From fixtures to the real system

**Planned.** Features move off fixtures one at a time. Only `data/queries.ts` and
`data/mutations.ts` change: they call `packages/db` query modules and `packages/builder` through
the wiring in `src/server/`, and map the results to the feature's own types. Components keep
their props. A feature's fixtures are deleted in the same pull request that replaces them.

The web app never calls the gateway to render a page; it reads the database. The gateway URL
appears only in what the page shows the visitor to copy.

## Cache Components rules

`cacheComponents` is on. During prerendering:

- Do not read the clock (`Date.now()`, `new Date()`) or randomness in render. Pass an explicit
  reference time (fixtures export `FIXTURE_REFERENCE_TIME`).
- Client components that read the URL (`useQueryState`, `useSearchParams`) must sit inside a
  `<Suspense>` boundary with a meaningful fallback.
- Request-time APIs (`cookies()`, `headers()`, `searchParams` prop) also need `<Suspense>`.
- Dynamic routes list their params with `generateStaticParams`.

Read `node_modules/next/dist/docs/01-app/02-guides/` before using any caching API.

## Adding a feature

1. Create `src/features/<name>/` with only the sub-folders you need.
2. Define types in `types.ts` and labels in `constants.ts`.
3. Put data access in `data/queries.ts` (with `import "server-only"`).
4. Build components in `components/`, reusing `components/shared` and `components/ui`.
5. Add the route in `src/app/(platform)/<route>/page.tsx` and, if it belongs in the main
   navigation, an entry in `src/config/navigation.ts`.
6. Update this document.

## Adding a shadcn/ui component

`pnpm dlx shadcn@latest add <name>`, then run `pnpm lint:fix`. Adjust it to the design system
inside the file. Remove it again if nothing uses it (Knip reports unused files).
