# Contributing

Thanks for your interest in World API. This guide covers setup, the checks a change must pass,
and how to propose one. By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node.js 24 or newer and pnpm 11.28.6, the version pinned in `package.json`.
`npm install --global pnpm@11.28.6` installs it with the npm that comes with Node; on Node 24,
`corepack enable` works too, but Node 25 and later no longer ship corepack. Nothing else: the
database is an in-process Postgres, so no container, service or account is needed.

```bash
git clone https://github.com/Brok3nnn/world-api.git
cd world-api
pnpm install
pnpm verify
```

To run the gateway against live sources, copy `.env.example` to `.env`, set `USER_AGENT_CONTACT`
and run `pnpm dev:gateway`. The [README](README.md#getting-started) has example requests.

## Before you open a pull request

Run the full gate; CI runs the same command and a pull request is merged only when it passes:

```bash
pnpm verify        # pnpm check, then pnpm test, then pnpm build
```

| Command | Checks |
| --- | --- |
| `pnpm lint` | Biome lint and format (`pnpm lint:fix` applies safe fixes) |
| `pnpm typecheck` | TypeScript in every workspace |
| `pnpm knip` | Unused files, exports and dependencies |
| `pnpm structure:check` | Document sizes and links, folder sizes, no ignored source files |
| `pnpm migrations:check` | The database schema has no change without a migration |
| `pnpm openapi:check` | `packages/contracts/openapi.json` matches the contract schemas |
| `pnpm test` | Every workspace's tests, with coverage floors |

A change also:

- adds tests for new behaviour, or a test that fails without the fix of a bug
  ([docs/testing.md](docs/testing.md));
- follows [docs/conventions.md](docs/conventions.md), whose size limits Biome enforces: split a
  unit that hits a limit rather than suppress the rule;
- regenerates the OpenAPI document (`pnpm openapi`) when a contract schema changes, and the
  migration (`pnpm --filter @repo/db migrations:generate --name=<change>`) when the database
  schema changes;
- updates the document that states a contract, a limit or a convention it changes;
- never weakens the egress policy, the output firewall or the expression sandbox without saying
  so in the pull request and adding tests.

Tests never touch the network, the system clock or real randomness. A data source is added to
the registry only with its licence, attribution and terms recorded from its own pages.

## Commit messages

A clear subject in the imperative mood, at most 72 characters and without a trailing period,
then a body that says why:

```
Render the csv shape
Refuse a redirect to a private address
Explain the 90-day source check
```

One logical change per commit.

## Proposing a change

1. For anything beyond a small fix, open an issue first and describe the problem; a change to
   the public contract, a limit or a decision recorded in [docs/decisions/](docs/decisions/README.md)
   needs agreement before code.
2. Branch from `main` (`feat/…`, `fix/…` or `docs/…`), keep the change focused, and fill in the
   pull request template.
3. A decision between real alternatives with lasting consequences gets a new decision record.

Security problems are reported privately, as [SECURITY.md](SECURITY.md) describes, never in a
public issue.

## Licence

Contributions are accepted under the project's licence, the
[GNU Affero General Public License v3.0 only](LICENSE).
