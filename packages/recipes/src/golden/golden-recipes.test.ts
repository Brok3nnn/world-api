import { ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { runRecipe } from "../engine/run-recipe";
import { applyFirewall } from "../firewall/apply-firewall";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createRecordedFetch } from "../recording/testing/recorded-fetch";
import { STEP_EXECUTORS } from "../steps/step-executors";
import { RECORDED_AT } from "./golden-recipe";
import { GOLDEN_RECIPES } from "./golden-recipes";

describe("golden recipes", () => {
  it.each(
    GOLDEN_RECIPES.map((golden) => [golden.ref, golden] as const),
  )("%s yields its expected value from its recordings, through the firewall", async (_ref, golden) => {
    const deps = {
      fetch: createRecordedFetch(golden.recordings),
      readEndpoint: createFakeEndpointReader(golden.endpoints),
      clock: createFakeClock(new Date(RECORDED_AT)),
    };

    const run = await runRecipe(golden.recipe, deps, STEP_EXECUTORS);
    const data = run.result.ok ? run.result.value.data : null;

    expect(run.result).toEqual(
      ok({ data: golden.expected.data, asOf: new Date(golden.expected.asOf) }),
    );
    expect(applyFirewall(data, golden.outputSpec)).toEqual(ok(golden.expected.data));
  });

  it("together use every step kind, and one of them is a mix", () => {
    const kinds = new Set(
      GOLDEN_RECIPES.flatMap((golden) => golden.recipe.steps.map((step) => step.use)),
    );
    const mixes = GOLDEN_RECIPES.filter((golden) =>
      golden.recipe.steps.every((step) => step.use !== "http.get"),
    );

    expect([...kinds].sort()).toEqual(Object.keys(STEP_EXECUTORS).sort());
    expect(mixes.map((golden) => golden.ref)).toEqual(["@core/weather-difference"]);
  });

  it("fetch only from the hosts they declare", () => {
    for (const golden of GOLDEN_RECIPES) {
      const hosts = golden.recordings.map((recording) => new URL(recording.url).hostname);

      expect(golden.hosts).toEqual(expect.arrayContaining(hosts));
    }
  });
});
