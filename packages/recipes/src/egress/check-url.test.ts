import { describe, expect, it } from "vitest";
import { checkUrl } from "./check-url";

const ALLOWED = ["api.example.org", "127.0.0.1", "[::1]"];

function reasonFor(url: string): string {
  const checked = checkUrl(url, ALLOWED);
  return checked.ok ? "allowed" : checked.error.reason;
}

describe("checkUrl", () => {
  it("returns the parsed URL of an allowed host", () => {
    const checked = checkUrl("https://api.example.org/v1/forecast?hours=1", ALLOWED);
    expect(checked.ok && checked.value.href).toBe("https://api.example.org/v1/forecast?hours=1");
  });

  it.each([
    "https://API.Example.org/v1",
    "https://api.example.org./v1",
    "https://api.example.org:443/v1",
  ])("matches the allow-list however the host is written: %s", (url) => {
    expect(reasonFor(url)).toBe("allowed");
  });

  it.each([
    ["not a url", "invalid_url"],
    ["http://api.example.org/", "not_https"],
    ["ftp://api.example.org/", "not_https"],
    ["https://user:secret@api.example.org/", "credentials_in_url"],
    ["https://user@api.example.org/", "credentials_in_url"],
    ["https://api.example.org:8443/", "port_not_allowed"],
    ["https://other.example.org/", "host_not_allowed"],
    ["https://deep.api.example.org/", "host_not_allowed"],
    ["https://api.example.org.example.net/", "host_not_allowed"],
    ["https://93.184.216.34/", "host_not_allowed"],
  ])("refuses %s as %s", (url, reason) => {
    expect(reasonFor(url)).toBe(reason);
  });

  it.each([
    "https://127.0.0.1/",
    "https://2130706433/",
    "https://0x7f.1/",
    "https://[::1]/",
    "https://[::ffff:127.0.0.1]/",
    "https://169.254.169.254/latest/meta-data",
  ])("refuses the non-public address in %s, even when it is listed", (url) => {
    expect(reasonFor(url)).toBe("address_not_public");
  });
});
