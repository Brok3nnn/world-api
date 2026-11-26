import { errorBodySchema } from "@repo/contracts/api/error";
import { buildStatusResponseSchema } from "@repo/contracts/build/build-status-response";
import { parseId } from "@repo/core/ids/id";
import { describe, expect, it } from "vitest";
import { createMemoryBuildQueue } from "../adapters/memory/memory-build-queue";
import { createApp } from "../app";
import type { BuildState } from "../ports/build-queue";
import { testDeps } from "../testing/test-deps";

function build(id: string, fields: Partial<BuildState>): BuildState {
  const parsed = parseId("build", id);
  if (!parsed.ok) {
    throw new Error(`${id} is not a build id.`);
  }
  return {
    id: parsed.value,
    status: "queued",
    stage: null,
    progress: 0,
    endpoint: null,
    reason: null,
    ...fields,
  };
}

const BUILDS = [
  build("bld_queued", {}),
  build("bld_running", { status: "running", stage: "test", progress: 0.66 }),
  build("bld_succeeded", {
    status: "succeeded",
    progress: 1,
    endpoint: { owner: "core", slug: "car-park-spots" },
  }),
  build("bld_failed", { status: "failed", progress: 1, reason: "No draft passed its trial runs." }),
  build("bld_rejected", {
    status: "rejected",
    progress: 1,
    reason: "Only data requests can be built.",
  }),
];

const app = createApp(testDeps({ builds: createMemoryBuildQueue(BUILDS) }));

function status(path: string) {
  return app(new Request(`https://api.example.com${path}`));
}

describe("GET /builds/{id}", () => {
  it.each(
    BUILDS.map((state) => [state.status, state] as const),
  )("answers a %s build with the contract's status", async (_status, state) => {
    const response = await status(`/builds/${state.id}`);
    const body = buildStatusResponseSchema.parse(await response.json());

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body).toEqual({
      ...state,
      endpoint: state.endpoint === null ? null : "https://api.example.com/@core/car-park-spots",
    });
  });

  it.each([
    ["an unknown build", "/builds/bld_unknown"],
    ["an id that is not a build id", "/builds/ep_weather"],
  ])("answers %s with 404 not_found", async (_case, path) => {
    const response = await status(path);

    expect([response.status, errorBodySchema.parse(await response.json()).error.code]).toEqual([
      404,
      "not_found",
    ]);
  });

  it("answers a query parameter with 400 invalid_request", async () => {
    expect((await status("/builds/bld_queued?wait=10")).status).toBe(400);
  });
});
