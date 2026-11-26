import { describe, expect, it } from "vitest";
import { nextRefresh } from "./next-refresh";

const FETCHED_AT = new Date("2026-11-21T11:49:10Z");

describe("nextRefresh", () => {
  it.each([
    ["1m", "2026-11-21T11:50:10Z"],
    ["15m", "2026-11-21T12:04:10Z"],
    ["1d", "2026-11-22T11:49:10Z"],
  ] as const)("is one %s interval after the fetch", (freshness, expected) => {
    expect(nextRefresh(FETCHED_AT, freshness)).toEqual(new Date(expected));
  });
});
