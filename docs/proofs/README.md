# Proof reports

Evidence that the engine and the gateway work against live public sources. Each report is
written by a proof command as it ran; how proofs work is described in
[../testing.md](../testing.md).

## Reports

| Proof | What it shows | Command | Report |
| --- | --- | --- | --- |
| A | Hand-written recipes fetch live approved sources through the egress policy and yield values that pass the output firewall | `pnpm proof:recipe` | [proof-a-2026-11-22.md](proof-a-2026-11-22.md) |
| B | The gateway, on a migrated and seeded in-process database, serves every catalog endpoint live in every shape, refreshes a stale value once under five concurrent calls, and degrades without a charge when a source fails | `pnpm proof:gateway` | [proof-b-2026-11-22.md](proof-b-2026-11-22.md) |

## Reading the 2026-11-22 reports

Both reports were produced on 2026-11-22, during development and before this repository was
published, so the commits they name are not part of its history. Two things changed since:

- The `probability` shape was removed from the API. Report B still lists it, answered with
  `400` as every endpoint did then.
- `sources` in the envelope used to hold the raw notes of the source registry, which report B
  shows cut short (`"sources":["None r…`). It is now one object per source with `name`, `url`,
  `licence` and `attribution`.

To produce current reports, run the commands with `USER_AGENT_CONTACT` set and network access;
each writes `<proof>-<date>.md` into this folder.

## What a report contains

1. The command, the commit it ran on and the time.
2. The inputs: the recipes, or the endpoints the gateway serves.
3. Each step with its evidence: requests and responses, traces, values.
4. The verdict, `PASS` or `FAIL`, and for a failure the first expectation that did not hold.
