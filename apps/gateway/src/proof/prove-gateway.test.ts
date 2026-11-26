import { err } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import type { RunFailure } from "@repo/recipes/engine/run-failure";
import { describe, expect, it } from "vitest";
import { createMemoryUsageSink } from "../adapters/memory/memory-usage-sink";
import { createMemoryValueStore } from "../adapters/memory/memory-value-store";
import { createApp, type Gateway } from "../app";
import type { RecipeRunner } from "../ports/recipe-runner";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import { servedEndpoint, testDeps } from "../testing/test-deps";
import type { ProofProbe, ProofWorld, ProvenEndpoint } from "./proof-world";
import { proofVerdict, proveGateway } from "./prove-gateway";

const served = servedEndpoint();

const endpoint: ProvenEndpoint = {
  id: served.id,
  owner: served.definition.owner,
  slug: served.definition.slug,
  freshness: served.definition.freshness,
  outputSpec: served.definition.output_spec,
  hosts: ["api.example.org"],
};

const PLAN = { catalog: [endpoint], stale: endpoint, failing: endpoint };

const UNREACHABLE: RunFailure = { code: "fetch_failed", step: "fetch" };

interface WorldOptions {
  /** How every run fails from the start; by default runs succeed until a host fails. */
  readonly failure?: RunFailure;
  readonly lastError?: string;
  readonly probe?: Partial<ProofProbe>;
  readonly wrap?: (gateway: Gateway) => Gateway;
  /** Whether `failHost` takes effect. */
  readonly hostsCanFail?: boolean;
}

/** The proof's world on memory adapters, with a runner that fails once a host is made to fail. */
function testWorld(options: WorldOptions = {}): ProofWorld {
  const clock = createFakeClock(new Date("2026-11-22T10:00:00.000Z"));
  const values = createMemoryValueStore();
  const usage = createMemoryUsageSink();
  const failedHosts = new Set<string>();
  const healthy = createFakeRecipeRunner();
  const broken = createFakeRecipeRunner(err(options.failure ?? UNREACHABLE));
  const runner: RecipeRunner = {
    run: (run) =>
      (options.failure !== undefined || failedHosts.size > 0 ? broken : healthy).run(run),
  };
  const gateway = createApp(testDeps({ clock, values, usage, runner }));
  return {
    gateway: options.wrap?.(gateway) ?? gateway,
    probe: {
      historyCount: async (id) => values.history.filter((entry) => entry.endpointId === id).length,
      lastUsage: async (id) =>
        usage.events.filter((event) => event.endpointId === id).at(-1) ?? null,
      lastError: async () => options.lastError ?? null,
      ...options.probe,
    },
    advance: (seconds) => clock.advance(seconds),
    failHost: (host) => {
      if (options.hostsCanFail ?? true) {
        failedHosts.add(host);
      }
    },
  };
}

async function verdicts(world: ProofWorld) {
  const demonstrations = await proveGateway(world, PLAN);
  return { all: demonstrations.map(({ verdict }) => verdict), run: proofVerdict(demonstrations) };
}

describe("proveGateway", () => {
  it("passes all four demonstrations on a working gateway", async () => {
    const demonstrations = await proveGateway(testWorld(), PLAN);
    expect(demonstrations.map(({ verdict }) => verdict)).toEqual(["pass", "pass", "pass", "pass"]);
    expect(proofVerdict(demonstrations)).toBe("pass");
    expect(demonstrations[1]?.findings).toEqual([
      "@core/weather-now-vienna: 200 in json, number, text, csv.",
    ]);
    expect(demonstrations[2]?.exchanges).toHaveLength(5);
    expect(demonstrations[3]?.findings.at(-1)).toContain("charged 0 credits");
  });

  it("reports a live source it cannot reach as unreachable, not as a failure", async () => {
    const world = testWorld({ failure: UNREACHABLE, lastError: "fetch_failed at fetch" });
    expect(await verdicts(world)).toEqual({ all: ["unreachable"], run: "unreachable" });
  });

  it("fails when an endpoint does not answer for another reason", async () => {
    const world = testWorld({
      failure: { code: "selector_empty", step: "pick" },
      lastError: "selector_empty at pick",
    });
    expect(await verdicts(world)).toEqual({ all: ["failed"], run: "failed" });
  });

  it("fails when a shape answers other than the output spec allows", async () => {
    const wrap =
      (gateway: Gateway): Gateway =>
      (request, client) =>
        request.url.endsWith("shape=csv")
          ? Promise.resolve(new Response("", { status: 500 }))
          : gateway(request, client);
    expect(await verdicts(testWorld({ wrap }))).toEqual({ all: ["pass", "failed"], run: "failed" });
  });

  it("names the shapes an endpoint refuses, as its output spec says it must", async () => {
    const { sentence: _sentence, ...withoutSentence } = endpoint.outputSpec;
    const wrap =
      (gateway: Gateway): Gateway =>
      (request, client) =>
        request.url.endsWith("shape=text")
          ? Promise.resolve(new Response("", { status: 400 }))
          : gateway(request, client);
    const plan = { ...PLAN, catalog: [{ ...endpoint, outputSpec: withoutSentence }] };

    const demonstrations = await proveGateway(testWorld({ wrap }), plan);

    expect(demonstrations[1]?.findings).toEqual([
      "@core/weather-now-vienna: 200 in json, number, csv; 400 in text.",
    ]);
  });

  it("fails when concurrent calls on a stale value do not refresh it exactly once", async () => {
    const world = testWorld({ probe: { historyCount: async () => 0 } });
    expect((await verdicts(world)).all).toEqual(["pass", "pass", "failed"]);
  });

  it("fails when the endpoint still answers after its source failed", async () => {
    expect((await verdicts(testWorld({ hostsCanFail: false }))).all).toEqual([
      "pass",
      "pass",
      "pass",
      "failed",
    ]);
  });

  it("fails when the degraded call is charged", async () => {
    const charged = { outcome: "degraded", priceCredits: 1 } as const;
    const world = testWorld({ probe: { lastUsage: async () => charged } });
    expect((await verdicts(world)).all).toEqual(["pass", "pass", "pass", "failed"]);
  });
});
