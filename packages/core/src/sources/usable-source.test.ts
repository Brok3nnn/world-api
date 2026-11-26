import { describe, expect, it } from "vitest";
import { addSeconds } from "../time/duration";
import { isUsableSource, POLICY_CHECK_VALID_S } from "./usable-source";

const NOW = new Date("2026-11-22T10:00:00Z");

describe("isUsableSource", () => {
  it("allows a green source checked within 90 days", () => {
    const checked = addSeconds(NOW, -(POLICY_CHECK_VALID_S - 1));

    expect(isUsableSource({ tier: "green", policyCheckedAt: checked }, NOW)).toBe(true);
  });

  it("refuses a green source whose check is 90 days old or older", () => {
    const checked = addSeconds(NOW, -POLICY_CHECK_VALID_S);

    expect(isUsableSource({ tier: "green", policyCheckedAt: checked }, NOW)).toBe(false);
  });

  it.each(["yellow", "red"] as const)("refuses a %s source, however fresh its check", (tier) => {
    expect(isUsableSource({ tier, policyCheckedAt: NOW }, NOW)).toBe(false);
  });
});
