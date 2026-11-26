import { describe, expect, it } from "vitest";
import { endpointPathSchema, endpointRefSchema, handleSchema, slugSchema } from "./endpoint-path";

describe("handleSchema", () => {
  it.each([
    ["letters, digits and underscores", "mira_field_7"],
    ["the shortest handle, 2 characters", "ab"],
    ["the longest handle, 32 characters", "a".repeat(32)],
  ])("accepts %s", (_rule, handle) => {
    expect(handleSchema.parse(handle)).toBe(handle);
  });

  it.each([
    ["1 character", "a"],
    ["33 characters", "a".repeat(33)],
    ["an uppercase letter", "Mira"],
    ["a hyphen", "mira-field"],
    ["a leading @", "@mira"],
    ["a space", "mira field"],
    ["nothing", ""],
  ])("rejects %s", (_rule, handle) => {
    expect(handleSchema.safeParse(handle).success).toBe(false);
  });
});

describe("slugSchema", () => {
  it.each([
    ["a single word", "weather"],
    ["words joined by single hyphens", "forest-cam-12"],
    ["a single character", "a"],
    ["the longest slug, 64 characters", "a".repeat(64)],
  ])("accepts %s", (_rule, slug) => {
    expect(slugSchema.parse(slug)).toBe(slug);
  });

  it.each([
    ["65 characters", "a".repeat(65)],
    ["a leading hyphen", "-weather"],
    ["a trailing hyphen", "weather-"],
    ["two hyphens in a row", "weather--now"],
    ["an uppercase letter", "Weather"],
    ["an underscore", "weather_now"],
    ["a slash", "weather/now"],
    ["nothing", ""],
  ])("rejects %s", (_rule, slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("endpointPathSchema", () => {
  it("accepts an owner and a slug", () => {
    const path = { owner: "mira_field", slug: "forest-cam-12" };

    expect(endpointPathSchema.parse(path)).toEqual(path);
  });

  it("rejects an invalid owner", () => {
    expect(endpointPathSchema.safeParse({ owner: "M", slug: "weather" }).success).toBe(false);
  });

  it("rejects an invalid slug", () => {
    expect(endpointPathSchema.safeParse({ owner: "core", slug: "-weather" }).success).toBe(false);
  });

  it("rejects an extra path segment", () => {
    const path = { owner: "core", slug: "weather", extra: "x" };

    expect(endpointPathSchema.safeParse(path).success).toBe(false);
  });
});

describe("endpointRefSchema", () => {
  it("accepts an owner and a slug written as one reference", () => {
    expect(endpointRefSchema.parse("@core/eur-huf")).toBe("@core/eur-huf");
  });

  it.each([
    ["a missing @", "core/eur-huf"],
    ["a missing slug", "@core"],
    ["an empty slug", "@core/"],
    ["an invalid owner", "@C/eur-huf"],
    ["an invalid slug", "@core/eur_huf"],
    ["a third segment", "@core/eur-huf/latest"],
    ["a full URL", "https://api.example.com/@core/eur-huf"],
  ])("rejects %s", (_rule, reference) => {
    expect(endpointRefSchema.safeParse(reference).success).toBe(false);
  });
});
