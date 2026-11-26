# 0003 — Start on one hosting platform; keep the gateway portable to edge isolates

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-11-22 |

## Context

The product analysis places the public data API on globally distributed edge isolates because
that is the cheapest and fastest runtime at hundreds of millions of calls. Running three
platforms from day one slows delivery while volume is small.

## Decision

Stage 1 runs everything on one managed hosting platform. The gateway is nevertheless a
separate app from the first day, written against Web-standard APIs and ports, so stage 2 can
move it to edge isolates by adding adapters and one entry file.

- The gateway core imports no Node built-ins; Node-only code is confined to one entry file and
  the Postgres adapters.
- Every stateful concern of the hot path sits behind a port
  ([../architecture/gateway.md](../architecture/gateway.md)).
- A portability test (`portable-app.test.ts`) guards this.

## Consequences

- First release is simpler: one platform, one runtime to operate.
- The portability rules cost some discipline now and exclude libraries that need Node.
- Moving to stage 2 is planned work triggered by measured volume or latency, not a
  rewrite.

## Alternatives considered

- Edge isolates from day one, as in the analysis: best end state, slowest start.
- Gateway inside the web app: fastest start, but a later move would be a rewrite.
