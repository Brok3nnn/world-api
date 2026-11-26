import { describe, expect, it } from "vitest";
import { endpointDefinitionSchema } from "./endpoint-definition";
import { ENDPOINT_DEFINITION_EXAMPLE } from "./examples/endpoint-definition-example";

function acceptsWith(overrides: Record<string, unknown>): boolean {
  return endpointDefinitionSchema.safeParse({ ...ENDPOINT_DEFINITION_EXAMPLE, ...overrides })
    .success;
}

describe("endpointDefinitionSchema", () => {
  it("accepts the example definition", () => {
    expect(endpointDefinitionSchema.parse(ENDPOINT_DEFINITION_EXAMPLE)).toEqual(
      ENDPOINT_DEFINITION_EXAMPLE,
    );
  });

  it("accepts a free endpoint", () => {
    expect(acceptsWith({ price_credits: 0 })).toBe(true);
  });

  it("accepts a title of 80 and a summary of 280 characters", () => {
    expect(acceptsWith({ title: "a".repeat(80), summary: "a".repeat(280) })).toBe(true);
  });

  it.each([
    ["an invalid owner", { owner: "Core" }],
    ["an invalid slug", { slug: "weather_now" }],
    ["an empty title", { title: "" }],
    ["a title of 81 characters", { title: "a".repeat(81) }],
    ["an empty summary", { summary: "" }],
    ["a summary of 281 characters", { summary: "a".repeat(281) }],
    ["an unknown category", { category: "sports" }],
    ["an unknown visibility", { visibility: "hidden" }],
    ["an unknown status", { status: "paused" }],
    ["an unknown method", { method: "guessed" }],
    ["an unknown freshness", { freshness: "30s" }],
    ["a negative price", { price_credits: -1 }],
    ["a fractional price", { price_credits: 0.5 }],
    ["an invalid output spec", { output_spec: { schema: { type: "number" } } }],
    ["a field that is not part of a definition", { likes: 12 }],
  ])("rejects %s", (_rule, overrides) => {
    expect(acceptsWith(overrides)).toBe(false);
  });

  // Safe: Object.keys returns exactly the keys of this constant object, typed as string[].
  it.each(
    Object.keys(ENDPOINT_DEFINITION_EXAMPLE) as (keyof typeof ENDPOINT_DEFINITION_EXAMPLE)[],
  )("rejects a definition without %s", (field) => {
    const { [field]: _removed, ...rest } = ENDPOINT_DEFINITION_EXAMPLE;

    expect(endpointDefinitionSchema.safeParse(rest).success).toBe(false);
  });
});
