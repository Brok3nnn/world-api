# Security and compliance

The guarantees the system makes and where each one is enforced. Every guarantee below is
enforced in one named place by deterministic code and has tests; none depends on a model
behaving well or on a caller being honest. Guarantees that belong to unbuilt parts are listed
separately as **Planned**.

## Enforced today

| Guarantee | Enforced in | Tested by |
| --- | --- | --- |
| A recipe can only read hosts of the sources approved for its endpoint | Egress policy, `packages/recipes/src/egress/`: allow-list, `https` on the standard port, no credentials in the URL, every resolved address public, each redirect checked again | `check-url`, `resolve-public-addresses`, `is-public-address` and `create-policed-fetch` tests |
| A checked address cannot be swapped by a second name lookup | The Node HTTP client connects to the approved address and never resolves again (`adapters/node-http-client.ts`); TLS still checks the host name | `node-http-client` tests against a loopback server |
| Nothing in the engine reaches the network another way | Only `createPolicedFetch` calls the `HttpClient` port, and nothing calls the platform's `fetch` | `policed-network-access.test.ts` scans the sources |
| Only output-spec fields leave the system | Output firewall (`applyFirewall`), applied by the gateway on every refresh | Firewall tests; gateway contract tests |
| A `red` source, or one whose terms were checked over 90 days ago, is never read | `usable-sources.ts` builds each run's allow-list from usable sources only (`isUsableSource` in `packages/core`) | `usable-sources` and refresh tests; `local-gateway.test.ts` |
| A recipe cannot loop, hang or grow without bound | Declarative steps only; `RECIPE_LIMITS` and `RUN_LIMITS`; JSONata without clock, randomness, `$eval` or regex literals; RE2 patterns that match in linear time | Engine, expression and step tests |
| Only a served value is priced | Gateway pipeline order: firewall before the usage event; every other outcome records 0 credits | `record-usage` tests for every non-200 outcome |
| Secrets and values never reach a log or an error | The engine reads no configuration; log fields are typed and never hold values or query text; errors never echo input | Engine, logger and route tests |
| One endpoint cannot harm another | Per-run limits; single-flight refresh; no shared mutable state between runs | Engine limit and refresh tests |

## Source tiers

| Tier | Meaning | May a recipe read it |
| --- | --- | --- |
| `green` | Open licence; commercial reuse and automated access permitted; attribution recorded | Yes, while its check is younger than 90 days |
| `yellow` | Permitted under conditions (rate, attribution wording, facts only) | Not yet: conditions cannot be encoded and enforced yet |
| `red` | Terms or machine-readable rules forbid automated access or reuse, or content is behind a login | Never |

Every source row records its short licence name, the attribution text the licence requires (or
none), the terms read when it was approved, the evidence URL, the date of that check and its rate
limit, as defined by `sourceDefinitionSchema` in `packages/contracts`. Only name, URL, licence
and attribution are ever returned to a caller. Its capabilities list what it offers, each with
one sample request on one of its own hosts.

A check older than 90 days makes the source unusable until it is renewed: re-read the source's
terms, update the source file in `packages/db/src/seed/sources/` (its `terms` and
`policy_checked_at`), and restart the gateway, which seeds again. `pnpm dev:gateway` logs a
`source.unusable` warning at start for every such source.

## Untrusted input

| Input | Treated as | Defence |
| --- | --- | --- |
| Request path and query | Hostile | Parsed by contract schemas; unknown and repeated parameters rejected |
| Source responses | Hostile data | Size cap, deadline, parsed and never executed |
| Recipe documents | Untrusted until validated | `recipeSchema` on write and before every run |

## Secrets and configuration

- Configuration is read in exactly one module per app (`env.ts`), validated at start-up, and
  passed down as typed values. No other file reads the environment (lint: `noProcessEnv`).
- The only configuration today is `USER_AGENT_CONTACT` and `LOG_LEVEL`; neither is a secret.
  Local values live in an untracked `.env`; the tracked `.env.example` lists names only.
- Nothing secret is committed, logged, placed in a URL or returned in an error.

## Privacy and abuse

- The system stores no personal data: usage events record an account id or nothing, and
  network addresses are used for rate limiting in memory only.
- Anonymous calls are rate-limited per address: a burst of 60, then one more each second.
- `max_age` cannot force refreshes faster than an endpoint's freshness floor.
- Every list has a maximum page size.

## Planned

These guarantees belong to the builder agent and to accounts, which are not built:

- **The model cannot act.** It has no tools; its output is parsed with a contract schema and then
  judged by the engine, the egress policy, trial runs and the firewall.
- **Never built, whatever the tier:** content behind a login or paywall, article text or images,
  data about identifiable people, investment, medical or betting advice.
- **Build limits:** per account, per day and by cost.
- **Own-data sources:** third-party keys encrypted at rest; camera sources return aggregates
  only and never store frames.
