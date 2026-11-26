# 0007 — Build the data API and AI-built endpoints first; everything else later

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

An early product analysis described a first release that includes balances, payments and an
agent server. The priority is different: first prove that the core works, namely serving data
through one call and having an agent create a working endpoint from a plain request.

## Decision

The work goes in order: foundations, contracts and data, the recipe engine, the gateway, the
builder agent, and the web app wired to them, each ending in a runnable proof. Accounts, keys,
billing, publishing own data, the agent server and community features are planned in detail
only when the core is proven.

- The core is built so those features are additive: the gateway already has the stages and
  ports where callers, limits, prices and metering plug in.
- No money moves in the core; prices are computed and reported, never charged.

## Consequences

- The riskiest and most distinctive part is proven first.
- The web app stays a prototype on fixtures until the core it shows exists.
- Business rules that are still undecided do not block any work.

## Alternatives considered

- Follow the analysis order: balances and payments early, builder late; delays the proof that
  matters most.
