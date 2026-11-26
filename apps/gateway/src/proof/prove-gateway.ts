import { type Envelope, envelopeSchema } from "@repo/contracts/api/envelope";
import { type ErrorBody, errorBodySchema } from "@repo/contracts/api/error";
import { shapeSchema } from "@repo/contracts/api/shape";
import { FRESHNESS_SECONDS } from "@repo/core/freshness/freshness-seconds";
import { GRACE_INTERVALS } from "@repo/core/freshness/within-grace";
import { supportedShapes } from "@repo/core/shape/supported-shapes";
import type { z } from "zod";
import {
  call,
  type Demonstration,
  type ProofPlan,
  type ProofWorld,
  type ProvenEndpoint,
  refOf,
  type Verdict,
} from "./proof-world";

/** How many calls arrive at once on the stale value. */
const CONCURRENT_CALLS = 5;

/** The refresh errors that mean a live source could not be reached. */
const UNREACHABLE = /^(fetch_failed|fetch_timeout)\b/;

type Ending = Pick<Demonstration, "verdict" | "findings">;

function pathOf(endpoint: ProvenEndpoint): string {
  return `/${refOf(endpoint)}`;
}

/** A body read with a contract schema, or `null` when it is not that. */
function bodyOf<Body>(schema: z.ZodType<Body>, body: string): Body | null {
  try {
    const parsed = schema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** What did not hold for one endpoint, after the findings that did. */
interface Fault {
  readonly endpoint: ProvenEndpoint;
  readonly finding: string;
  readonly findings: readonly string[];
}

/** A failed ending, or an unreachable one when the endpoint's last refresh found no source. */
async function fault(world: ProofWorld, { endpoint, finding, findings }: Fault): Promise<Ending> {
  const error = await world.probe.lastError(endpoint.id);
  if (error !== null && UNREACHABLE.test(error)) {
    const reason = `${refOf(endpoint)} could not reach its source (${error}).`;
    return { verdict: "unreachable", findings: [...findings, reason] };
  }
  return { verdict: "failed", findings: [...findings, finding] };
}

async function answersLive(world: ProofWorld, { catalog }: ProofPlan): Promise<Demonstration> {
  const title = "Every catalog endpoint answers live";
  const findings: string[] = [];
  const exchanges = [];
  for (const endpoint of catalog) {
    const exchange = await call(world, pathOf(endpoint));
    exchanges.push(exchange);
    const envelope = bodyOf<Envelope>(envelopeSchema, exchange.body);
    if (exchange.status !== 200 || envelope === null) {
      const finding = `${refOf(endpoint)} answered ${exchange.status} without an envelope.`;
      return { title, exchanges, ...(await fault(world, { endpoint, finding, findings })) };
    }
    findings.push(`${refOf(endpoint)} answered 200, a value as of ${envelope.as_of}.`);
  }
  return { title, verdict: "pass", findings, exchanges };
}

async function answersEveryShape(world: ProofWorld, plan: ProofPlan): Promise<Demonstration> {
  const title = "Every shape answers as the output spec allows";
  const findings: string[] = [];
  const exchanges = [];
  for (const endpoint of plan.catalog) {
    const supported = supportedShapes(endpoint.outputSpec);
    for (const shape of shapeSchema.options) {
      const exchange = await call(world, `${pathOf(endpoint)}?shape=${shape}`);
      exchanges.push(exchange);
      const expected = supported.includes(shape) ? 200 : 400;
      if (exchange.status !== expected) {
        const finding = `${refOf(endpoint)} in ${shape} answered ${exchange.status}, not ${expected}.`;
        return { title, verdict: "failed", findings: [...findings, finding], exchanges };
      }
    }
    const refused = shapeSchema.options.filter((shape) => !supported.includes(shape));
    const refusals = refused.length > 0 ? `; 400 in ${refused.join(", ")}` : "";
    findings.push(`${refOf(endpoint)}: 200 in ${supported.join(", ")}${refusals}.`);
  }
  return { title, verdict: "pass", findings, exchanges };
}

async function refreshesOnce(world: ProofWorld, { stale }: ProofPlan): Promise<Demonstration> {
  const title = "Concurrent calls on a stale value refresh it once";
  const before = await world.probe.historyCount(stale.id);
  const seconds = FRESHNESS_SECONDS[stale.freshness];
  world.advance(seconds);
  const exchanges = await Promise.all(
    Array.from({ length: CONCURRENT_CALLS }, () => call(world, pathOf(stale))),
  );
  const refreshes = (await world.probe.historyCount(stale.id)) - before;
  const values = exchanges.map((exchange) => bodyOf<Envelope>(envelopeSchema, exchange.body));
  const asOfs = new Set(values.map((envelope) => envelope?.as_of));
  const findings = [
    `The clock moved ${seconds} s forward, one freshness interval: the value of ${refOf(stale)} was stale.`,
  ];
  if (refreshes !== 1 || values.includes(null) || asOfs.size !== 1) {
    const finding = `${CONCURRENT_CALLS} concurrent calls refreshed it ${refreshes} times and answered ${asOfs.size} values.`;
    return { title, exchanges, ...(await fault(world, { endpoint: stale, finding, findings })) };
  }
  findings.push(
    `${CONCURRENT_CALLS} concurrent calls answered 200 with one value; the history gained one row.`,
  );
  return { title, verdict: "pass", findings, exchanges };
}

async function degrades(world: ProofWorld, { failing }: ProofPlan): Promise<Demonstration> {
  const title = "A failing source degrades the endpoint without a charge";
  for (const host of failing.hosts) {
    world.failHost(host);
  }
  const seconds = FRESHNESS_SECONDS[failing.freshness] * (1 + GRACE_INTERVALS);
  world.advance(seconds);
  const exchange = await call(world, pathOf(failing));
  const usage = await world.probe.lastUsage(failing.id);
  const code = bodyOf<ErrorBody>(errorBodySchema, exchange.body)?.error.code;
  const findings = [
    `${failing.hosts.join(", ")} failed, and the clock moved ${seconds} s forward, past the grace period of ${refOf(failing)}.`,
  ];
  const exchanges = [exchange];
  if (exchange.status !== 503 || code !== "degraded" || exchange.retryAfter === null) {
    const finding = `${refOf(failing)} answered ${exchange.status} ${code ?? "without an error code"}, not 503 degraded with retry-after.`;
    return { title, verdict: "failed", findings: [...findings, finding], exchanges };
  }
  if (usage?.outcome !== "degraded" || usage.priceCredits !== 0) {
    const finding = "The call was not recorded as a degraded call of 0 credits.";
    return { title, verdict: "failed", findings: [...findings, finding], exchanges };
  }
  findings.push(
    `${refOf(failing)} answered 503 degraded, retry after ${exchange.retryAfter} s; its usage event charged 0 credits.`,
  );
  return { title, verdict: "pass", findings, exchanges };
}

const DEMONSTRATIONS = [answersLive, answersEveryShape, refreshesOnce, degrades];

/**
 * Runs the four demonstrations of Proof B in order against the gateway, and stops at the first
 * that does not pass.
 */
export async function proveGateway(
  world: ProofWorld,
  plan: ProofPlan,
): Promise<readonly Demonstration[]> {
  const demonstrations: Demonstration[] = [];
  for (const demonstrate of DEMONSTRATIONS) {
    const demonstration = await demonstrate(world, plan);
    demonstrations.push(demonstration);
    if (demonstration.verdict !== "pass") {
      break;
    }
  }
  return demonstrations;
}

/** The verdict of a run: that of the demonstration it stopped at, else a pass. */
export function proofVerdict(demonstrations: readonly Demonstration[]): Verdict {
  return (
    demonstrations.find((demonstration) => demonstration.verdict !== "pass")?.verdict ?? "pass"
  );
}
