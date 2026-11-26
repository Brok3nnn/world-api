import { envelopeSchema } from "@repo/contracts/api/envelope";
import { errorBodySchema } from "@repo/contracts/api/error";
import { err } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createApp } from "../app";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";

function call(pathAndQuery: string) {
  const app = createApp(testDeps({ values: valuesWith(storedValue(60)) }));
  return app(new Request(`https://api.example.com${pathAndQuery}`));
}

describe("GET /@{owner}/{slug}", () => {
  it("answers a well-formed call with the envelope of the endpoint's fresh value", async () => {
    const response = await call("/@core/weather-now-vienna");

    expect(response.status).toBe(200);
    expect(envelopeSchema.parse(await response.json())).toEqual({
      data: { temperature_c: 4.2 },
      as_of: "2026-11-22T09:58:00.000Z",
      sources: [
        {
          name: "Weather service",
          url: "https://example.org/docs/weather",
          licence: "CC BY 4.0",
          attribution: "Weather data: Weather service, CC BY 4.0",
        },
      ],
      next_refresh: "2026-11-22T10:14:00.000Z",
      method: "computed",
      price_credits: 1,
    });
  });

  it("refreshes a stale value once and returns the new one", async () => {
    const runner = createFakeRecipeRunner();
    const app = createApp(testDeps({ runner, values: valuesWith(storedValue(900)) }));

    const response = await app(new Request("https://api.example.com/@core/weather-now-vienna"));

    expect(response.status).toBe(200);
    expect(envelopeSchema.parse(await response.json()).data).toEqual({ temperature_c: 5.1 });
    expect(runner.runs).toHaveLength(1);
  });

  it("runs the recipe exactly once for ten concurrent calls of one stale endpoint", async () => {
    const runner = createFakeRecipeRunner();
    const app = createApp(testDeps({ runner, values: valuesWith(storedValue(900)) }));
    const calls = Array.from({ length: 10 }, () =>
      app(new Request("https://api.example.com/@core/weather-now-vienna")),
    );

    const responses = await Promise.all(calls);

    expect(runner.runs).toHaveLength(1);
    expect(
      await Promise.all(
        responses.map(async (response) => envelopeSchema.parse(await response.json()).data),
      ),
    ).toEqual(Array.from({ length: 10 }, () => ({ temperature_c: 5.1 })));
  });

  it("serves every waiting call the stored value within grace when the one refresh fails", async () => {
    const runner = createFakeRecipeRunner(err({ code: "fetch_failed", step: "now" }));
    const app = createApp(testDeps({ runner, values: valuesWith(storedValue(1_000)) }));
    const call = () => app(new Request("https://api.example.com/@core/weather-now-vienna"));

    const statuses = (await Promise.all([call(), call(), call()])).map(
      (response) => response.status,
    );

    expect(statuses).toEqual([200, 200, 200]);
    expect(runner.runs).toHaveLength(1);
  });

  it("runs no recipe for a fresh value", async () => {
    const runner = createFakeRecipeRunner();
    const app = createApp(testDeps({ runner, values: valuesWith(storedValue(60)) }));

    await app(new Request("https://api.example.com/@core/weather-now-vienna"));

    expect(runner.runs).toEqual([]);
  });

  it.each([
    ["serves the stored value within its grace period", 900, 200],
    ["answers 503 degraded past the grace period", 3_600, 503],
  ])("%s when the refresh fails", async (_case, ageS, status) => {
    const runner = createFakeRecipeRunner(err({ code: "fetch_failed", step: "now" }));
    const app = createApp(testDeps({ runner, values: valuesWith(storedValue(ageS)) }));

    const response = await app(new Request("https://api.example.com/@core/weather-now-vienna"));

    expect(response.status).toBe(status);
  });

  it("accepts every parameter of api.md", async () => {
    const response = await call("/@core/weather-now-vienna?shape=csv&max_age=600&max_price=5");

    expect(response.status).toBe(200);
  });

  it.each([
    ["an owner that is too short", "/@c/rain"],
    ["an owner with capitals", "/@Core/rain"],
    ["a slug with a double hyphen", "/@core/rain--next"],
    ["a slug that is too long", `/@core/${"a".repeat(65)}`],
    ["an encoded character in the slug", "/@core/rain%2Dnext"],
    ["no slug", "/@core"],
    ["a third segment", "/@core/rain/next"],
    ["an unknown parameter", "/@core/rain?city=vienna"],
    ["a parameter given twice", "/@core/rain?shape=json&shape=csv"],
    ["an unknown shape", "/@core/rain?shape=xml"],
    ["max_age of zero", "/@core/rain?max_age=0"],
    ["max_age with a fraction", "/@core/rain?max_age=1.5"],
    ["max_age over a year", "/@core/rain?max_age=31536001"],
    ["a max_price with a fraction", "/@core/rain?max_price=0.01"],
    ["a negative max_price", "/@core/rain?max_price=-1"],
    ["the probability shape, which the API does not offer", "/@core/rain?shape=probability"],
    ["a question, which no shape answers", "/@core/rain?ask=Rain%3F"],
  ])("answers %s with 400 invalid_request and a hint", async (_case, pathAndQuery) => {
    const response = await call(pathAndQuery);
    const body = errorBodySchema.parse(await response.json());

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.hint).toMatch(/^(Use|Call|This route)/);
  });

  it("never echoes what the caller sent", async () => {
    const response = await call("/@core/rain?value-marker=1");

    expect(await response.text()).not.toContain("value-marker");
  });
});

describe("GET /@{owner}/{slug} resolving the endpoint", () => {
  const endpoints = createMemoryEndpointDirectory([
    servedEndpoint({ slug: "disabled-one", status: "disabled" }),
    servedEndpoint({ slug: "building-one", status: "building" }),
    servedEndpoint({ slug: "private-one", visibility: "private" }),
    servedEndpoint({ slug: "degraded-one", status: "degraded" }),
    servedEndpoint({ slug: "unlisted-one", visibility: "unlisted" }),
  ]);

  function resolve(slug: string) {
    return createApp(testDeps({ endpoints }))(new Request(`https://api.example.com/@core/${slug}`));
  }

  it.each([
    "unknown-one",
    "disabled-one",
    "building-one",
    "private-one",
  ])("answers %s with the same 404 not_found, revealing nothing", async (slug) => {
    const response = await resolve(slug);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: {
        code: "not_found",
        message: "There is no such endpoint.",
        hint: "Check the owner and the slug, or find endpoints with /search?q=.",
      },
    });
  });

  it.each([
    ["degraded-one", "ep_degraded_one"],
    ["unlisted-one", "ep_unlisted_one"],
  ])("serves %s (%s), refreshing its first value", async (slug) => {
    expect((await resolve(slug)).status).toBe(200);
  });
});
