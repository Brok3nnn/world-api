import { err } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { createNodeResolveHost } from "./node-resolve-host";

describe("createNodeResolveHost", () => {
  it("returns every address the system resolver knows for a name", async () => {
    const resolved = await createNodeResolveHost()("localhost");

    expect(resolved.ok && resolved.value.length).toBeGreaterThan(0);
    expect(
      resolved.ok && resolved.value.every((address) => ["127.0.0.1", "::1"].includes(address)),
    ).toBe(true);
  });

  it("reports a name the resolver cannot find as unresolved", async () => {
    const failing = createNodeResolveHost(() => Promise.reject(new Error("not found")));

    expect(await failing("gone.example.org")).toEqual(err({ code: "unresolved" }));
  });
});
