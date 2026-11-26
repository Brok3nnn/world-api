import { describe, expect, it } from "vitest";
import { storedId } from "./stored-id";

describe("storedId", () => {
  it("returns an id that has the shape of its kind", () => {
    expect(storedId("endpoint", "ep_weather_now")).toBe("ep_weather_now");
  });

  it("treats an id of the wrong shape as a defect", () => {
    expect(() => storedId("endpoint", "bld_1")).toThrow(
      'Stored endpoint id "bld_1" does not match its contract.',
    );
  });
});
