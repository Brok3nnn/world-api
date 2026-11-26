import { describe, expect, it } from "vitest";
import { z } from "zod";
import { enumValues } from "./enum-values";

describe("enumValues", () => {
  it("returns the members of a closed list in order", () => {
    expect(enumValues(z.enum(["live", "degraded"]))).toEqual(["live", "degraded"]);
  });

  it("refuses an empty list, which no column could hold", () => {
    expect(() => enumValues({ options: [] })).toThrow("A closed list needs at least one value.");
  });
});
