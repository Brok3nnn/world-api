import { describe, expect, it } from "vitest";
import { canTransition } from "./can-transition";

const LIGHT = { red: ["green"], green: ["amber"], amber: ["red"] } as const;

describe("canTransition", () => {
  it("allows a move the table lists", () => {
    expect(canTransition(LIGHT, "red", "green")).toBe(true);
  });

  it("forbids a move the table does not list", () => {
    expect(canTransition(LIGHT, "red", "amber")).toBe(false);
  });

  it("forbids staying in the same status unless the table lists it", () => {
    expect(canTransition(LIGHT, "green", "green")).toBe(false);
  });
});
