import { err, ok } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { createFakeResolveHost } from "../ports/testing/fake-resolve-host";
import { resolvePublicAddresses } from "./resolve-public-addresses";

const resolveHost = createFakeResolveHost({
  "api.example.org": ["93.184.216.34", "2606:2800:220:1::1"],
  "mixed.example.org": ["93.184.216.34", "10.0.0.7"],
  "mapped.example.org": ["::ffff:10.0.0.7"],
  "empty.example.org": [],
});

describe("resolvePublicAddresses", () => {
  it("returns every address of a name that resolves to public addresses only", async () => {
    expect(await resolvePublicAddresses("api.example.org", resolveHost)).toEqual(
      ok(["93.184.216.34", "2606:2800:220:1::1"]),
    );
  });

  it.each([
    "mixed.example.org",
    "mapped.example.org",
  ])("refuses %s, which resolves to a private address", async (host) => {
    expect(await resolvePublicAddresses(host, resolveHost)).toEqual(
      err({ code: "policy_denied", reason: "address_not_public" }),
    );
  });

  it.each([
    "unknown.example.org",
    "empty.example.org",
  ])("cannot reach %s, which gives no address", async (host) => {
    expect(await resolvePublicAddresses(host, resolveHost)).toEqual(err({ code: "fetch_failed" }));
  });

  it("takes a host written as a public address as it is, without resolving it", async () => {
    const resolveNothing = createFakeResolveHost({});
    expect(await resolvePublicAddresses("93.184.216.34", resolveNothing)).toEqual(
      ok(["93.184.216.34"]),
    );
    expect(await resolvePublicAddresses("[2606:4700::1111]", resolveNothing)).toEqual(
      ok(["[2606:4700::1111]"]),
    );
  });
});
