import { errorBodySchema } from "@repo/contracts/api/error";
import { describe, expect, it } from "vitest";
import { createMemoryEndpointDirectory } from "../adapters/memory/memory-endpoint-directory";
import { createApp } from "../app";
import { createFakeRecipeRunner } from "../ports/testing/fake-recipe-runner";
import { servedEndpoint, storedValue, testDeps, valuesWith } from "../testing/test-deps";

/** A stale value of an endpoint that costs `price` credits, so serving it would run the recipe. */
function call(maxPrice: string | null, price = 2) {
  const runner = createFakeRecipeRunner();
  const endpoints = createMemoryEndpointDirectory([servedEndpoint({ price_credits: price })]);
  const app = createApp(testDeps({ runner, endpoints, values: valuesWith(storedValue(900)) }));
  const query = maxPrice === null ? "" : `?max_price=${maxPrice}`;
  return {
    runner,
    response: app(new Request(`https://api.example.com/@core/weather-now-vienna${query}`)),
  };
}

describe("guardPrice", () => {
  it("refuses a call over its max_price with 402 before any recipe runs", async () => {
    const { runner, response } = call("1");
    const answer = await response;

    expect(answer.status).toBe(402);
    expect(errorBodySchema.parse(await answer.json()).error).toEqual({
      code: "payment_required",
      message: "This call costs more than max_price.",
      hint: "It costs 2 credits; raise max_price or leave it out.",
    });
    expect(runner.runs).toEqual([]);
  });

  it.each([
    ["at exactly its price", "2", 2],
    ["without a max_price", null, 2],
    ["that is free, under a cap of zero", "0", 0],
  ])("serves a call %s", async (_case, maxPrice, price) => {
    expect((await call(maxPrice, price).response).status).toBe(200);
  });

  it("names a price of one credit in the singular", async () => {
    const answer = await call("0", 1).response;

    expect(errorBodySchema.parse(await answer.json()).error.hint).toBe(
      "It costs 1 credit; raise max_price or leave it out.",
    );
  });
});
