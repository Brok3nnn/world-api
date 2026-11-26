import { envelopeSchema } from "@repo/contracts/api/envelope";
import { type ErrorCode, errorBodySchema } from "@repo/contracts/api/error";
import { ENVELOPE_EXAMPLE } from "@repo/contracts/api/examples/envelope-example";
import { ERROR_EXAMPLES } from "@repo/contracts/api/examples/error-examples";
import { buildStatusResponseSchema } from "@repo/contracts/build/build-status-response";
import { BUILD_STATUS_RESPONSE_EXAMPLE } from "@repo/contracts/build/examples/build-examples";
import { SEARCH_PAGE_EXAMPLE } from "@repo/contracts/search/examples/search-page-example";
import { searchPageSchema } from "@repo/contracts/search/search-page";
import { parseId } from "@repo/core/ids/id";
import { err } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { createMemoryBuildQueue } from "../adapters/memory/memory-build-queue";
import { createApp } from "../app";
import type { GatewayDeps } from "../gateway-deps";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import { storedValue, testDeps, valuesWith } from "../testing/test-deps";
import type { Route } from "./route";

const BUILD = parseId("build", "bld_contract");
const BUILDS = createMemoryBuildQueue(
  BUILD.ok
    ? [
        {
          id: BUILD.value,
          status: "running",
          stage: "test",
          progress: 0.5,
          endpoint: null,
          reason: null,
        },
      ]
    : [],
);
const DEGRADED = {
  values: valuesWith(storedValue(3_600)),
  runner: createFakeRecipeRunner(err({ code: "fetch_failed", step: "now" })),
};
const BROKEN: Route = { matches: () => true, handle: () => Promise.reject(new Error("defect")) };

/** A success body: it parses with its schema and has exactly the fields of the contract's example. */
const SUCCESS: Readonly<Record<string, readonly [z.ZodType, object]>> = {
  envelope: [envelopeSchema, ENVELOPE_EXAMPLE],
  search: [searchPageSchema, SEARCH_PAGE_EXAMPLE],
  build: [buildStatusResponseSchema, BUILD_STATUS_RESPONSE_EXAMPLE],
};

interface Case {
  readonly path: string;
  readonly status: number;
  /** The success body, or `error` with the code of an error body. */
  readonly body?: "envelope" | "search" | "build" | "text";
  readonly error?: ErrorCode;
  readonly deps?: Partial<GatewayDeps>;
  /** Calls made first, from the same address, to use up its rate. */
  readonly before?: number;
}

const CASES: Readonly<Record<string, Case>> = {
  "GET /healthz": { path: "/healthz", status: 200, body: "text" },
  "GET /@{owner}/{slug} served": {
    path: "/@core/weather-now-vienna",
    status: 200,
    body: "envelope",
  },
  "GET /@{owner}/{slug} malformed": {
    path: "/@core/weather-now-vienna?shape=xml",
    status: 400,
    error: "invalid_request",
  },
  "GET /@{owner}/{slug} over max_price": {
    path: "/@core/weather-now-vienna?max_price=0",
    status: 402,
    error: "payment_required",
  },
  "GET /@{owner}/{slug} unknown": { path: "/@core/unknown", status: 404, error: "not_found" },
  "GET /@{owner}/{slug} too often": {
    path: "/@core/weather-now-vienna",
    status: 429,
    error: "rate_limited",
    before: 60,
  },
  "GET /@{owner}/{slug} degraded": {
    path: "/@core/weather-now-vienna",
    status: 503,
    error: "degraded",
    deps: DEGRADED,
  },
  "GET /search": { path: "/search?q=weather", status: 200, body: "search" },
  "GET /search malformed": { path: "/search", status: 400, error: "invalid_request" },
  "GET /search too often": {
    path: "/search?q=weather",
    status: 429,
    error: "rate_limited",
    before: 60,
  },
  "GET /builds/{id}": {
    path: "/builds/bld_contract",
    status: 200,
    body: "build",
    deps: { builds: BUILDS },
  },
  "GET /builds/{id} malformed": {
    path: "/builds/bld_contract?wait=1",
    status: 400,
    error: "invalid_request",
  },
  "GET /builds/{id} unknown": { path: "/builds/bld_unknown", status: 404, error: "not_found" },
  "GET /builds/{id} too often": {
    path: "/builds/bld_contract",
    status: 429,
    error: "rate_limited",
    before: 60,
    deps: { builds: BUILDS },
  },
};

async function answer(spec: Case): Promise<Response> {
  const app = createApp(testDeps({ values: valuesWith(storedValue(60)), ...spec.deps }));
  for (let call = 0; call < (spec.before ?? 0); call += 1) {
    await app(new Request(`https://api.example.com${spec.path}`));
  }
  return app(new Request(`https://api.example.com${spec.path}`));
}

function expectErrorBody(body: unknown, code: ErrorCode): void {
  const parsed = errorBodySchema.parse(body);
  const example = Object.entries(ERROR_EXAMPLES).find(([name]) => name === code)?.[1];
  expect(parsed.error.code).toBe(code);
  expect(parsed.error.hint === undefined).toBe(code === "internal_error");
  if (example !== undefined) {
    expect(Object.keys(parsed.error).sort()).toEqual(Object.keys(example.error).sort());
  }
}

describe("the contract of every route", () => {
  it.each(Object.entries(CASES))("%s", async (_name, spec) => {
    const response = await answer(spec);

    expect(response.status).toBe(spec.status);
    expect(response.headers.get("x-request-id")).toMatch(/^req_/);
    if (spec.error !== undefined) {
      expectErrorBody(await response.json(), spec.error);
    } else if (spec.body === "text") {
      expect(await response.text()).toBe("ok");
    } else {
      const [schema, example] = SUCCESS[spec.body ?? "envelope"] ?? [errorBodySchema, {}];
      const body: unknown = await response.json();
      expect(schema.safeParse(body).success).toBe(true);
      expect(Object.keys(body ?? {}).sort()).toEqual(Object.keys(example).sort());
    }
    if (spec.status === 429 || spec.status === 503) {
      expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    }
  });

  it("answers a defect on any route with the internal_error body and no detail", async () => {
    const response = await createApp(testDeps(), [BROKEN])(
      new Request("https://api.example.com/@core/x"),
    );

    expect(response.status).toBe(500);
    expectErrorBody(await response.json(), "internal_error");
  });

  it("covers every status api.md gives the served routes", () => {
    const covered = new Set([...Object.values(CASES).map((spec) => spec.status), 500]);

    expect([...covered].sort()).toEqual([200, 400, 402, 404, 429, 500, 503]);
  });
});
