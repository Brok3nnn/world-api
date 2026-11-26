import type { Freshness } from "@repo/contracts/endpoint/freshness";
import type { OutputSpec } from "@repo/contracts/endpoint/output-spec";
import type { EndpointId } from "@repo/core/ids/id";
import type { Gateway } from "../app";
import type { UsageEvent } from "../ports/usage-sink";

/** One catalog endpoint as the proof calls it. */
export interface ProvenEndpoint {
  readonly id: EndpointId;
  readonly owner: string;
  readonly slug: string;
  readonly freshness: Freshness;
  readonly outputSpec: OutputSpec;
  /** The source hosts its recipe fetches; none for a mix. */
  readonly hosts: readonly string[];
}

/** The evidence the proof reads from the system of record. */
export interface ProofProbe {
  /** How many values the endpoint has had: one more after every successful refresh. */
  historyCount(endpointId: EndpointId): Promise<number>;
  /** The endpoint's most recent usage event. */
  lastUsage(endpointId: EndpointId): Promise<Pick<UsageEvent, "outcome" | "priceCredits"> | null>;
  /** The error of the endpoint's last failed refresh, such as `fetch_failed at fetch`. */
  lastError(endpointId: EndpointId): Promise<string | null>;
}

/** The gateway under proof, and how the proof steers the world around it. */
export interface ProofWorld {
  readonly gateway: Gateway;
  readonly probe: ProofProbe;
  /** Moves the gateway's clock forward. */
  advance(seconds: number): void;
  /** Makes every later request to the host fail, as a source that is down. */
  failHost(host: string): void;
}

/** Which endpoints the proof calls, and which ones it makes stale and failing. */
export interface ProofPlan {
  readonly catalog: readonly ProvenEndpoint[];
  readonly stale: ProvenEndpoint;
  readonly failing: ProvenEndpoint;
}

/** One request of the proof and what came back. */
export interface Exchange {
  readonly path: string;
  readonly status: number;
  readonly contentType: string | null;
  readonly retryAfter: string | null;
  readonly body: string;
}

/** How a demonstration ended: a source that cannot be reached is not a failure of the gateway. */
export type Verdict = "pass" | "failed" | "unreachable";

/** One demonstration of the proof, its requests, and what held or the first thing that did not. */
export interface Demonstration {
  readonly title: string;
  readonly verdict: Verdict;
  readonly findings: readonly string[];
  readonly exchanges: readonly Exchange[];
}

/** Where the proof's calls come from: an address reserved for documentation. */
const PROOF_CLIENT = { address: "192.0.2.10" };

const PROOF_ORIGIN = "https://api.example.com";

/** Calls the gateway as a client would and keeps what the proof shows. */
export async function call(world: ProofWorld, path: string): Promise<Exchange> {
  const response = await world.gateway(new Request(`${PROOF_ORIGIN}${path}`), PROOF_CLIENT);
  return {
    path,
    status: response.status,
    contentType: response.headers.get("content-type"),
    retryAfter: response.headers.get("retry-after"),
    body: await response.text(),
  };
}

/** `@owner/slug`, the way the proof names an endpoint. */
export function refOf(endpoint: ProvenEndpoint): string {
  return `@${endpoint.owner}/${endpoint.slug}`;
}
