import { describe, expect, it } from "vitest";
import { ENVELOPE_EXAMPLE } from "../api/examples/envelope-example";
import { UNIVERSAL_ENTRY_HIT_EXAMPLE } from "./examples/universal-entry-examples";
import { universalEntryHitSchema } from "./universal-entry-hit";

describe("universalEntryHitSchema", () => {
  it("accepts the envelope with the permanent URL of the endpoint", () => {
    expect(universalEntryHitSchema.parse(UNIVERSAL_ENTRY_HIT_EXAMPLE)).toEqual(
      UNIVERSAL_ENTRY_HIT_EXAMPLE,
    );
  });

  it("rejects a plain envelope without the endpoint", () => {
    expect(universalEntryHitSchema.safeParse(ENVELOPE_EXAMPLE).success).toBe(false);
  });

  it("rejects an endpoint that is not an https URL", () => {
    const hit = { ...UNIVERSAL_ENTRY_HIT_EXAMPLE, endpoint: "/@mira_field/forest-cam-12" };

    expect(universalEntryHitSchema.safeParse(hit).success).toBe(false);
  });

  it("rejects a field that is not part of the response", () => {
    const hit = { ...UNIVERSAL_ENTRY_HIT_EXAMPLE, score: 0.9 };

    expect(universalEntryHitSchema.safeParse(hit).success).toBe(false);
  });
});
