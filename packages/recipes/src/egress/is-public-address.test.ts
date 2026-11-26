import { describe, expect, it } from "vitest";
import { isIpLiteral, isPublicAddress } from "./is-public-address";

/** Space-separated lists, one line per family of ranges, so every range has a case. */
function addresses(...lines: string[]): string[] {
  return lines.flatMap((line) => line.split(" "));
}

const PUBLIC = addresses(
  "93.184.216.34 8.8.8.8 11.0.0.1 100.128.0.1 172.32.0.1",
  "2606:4700::1111 [2606:4700::1111] 2001:4860:4860::8888 ::ffff:8.8.8.8",
);

const NON_PUBLIC = addresses(
  // This network, private, carrier-grade NAT, loopback, link-local with cloud metadata.
  "0.0.0.0 10.1.2.3 100.64.0.1 127.0.0.1 169.254.169.254 172.16.0.1 172.31.255.255",
  // Protocol, documentation, former 6to4 relay, private, benchmarking, documentation twice.
  "192.0.0.1 192.0.2.1 192.88.99.1 192.168.1.1 198.18.0.1 198.51.100.1 203.0.113.1",
  // Multicast, broadcast.
  "224.0.0.1 255.255.255.255",
  // Unspecified, loopback, link-local, unique local with cloud metadata, multicast, NAT64.
  ":: ::1 [::1] fe80::1 fc00::1 fd00:ec2::254 ff02::1 64:ff9b::7f00:1",
  // Teredo, documentation, 6to4, documentation.
  "2001::1 2001:db8::1 2002:7f00:1::1 3fff::1",
  // IPv4-mapped, judged as the IPv4 address they carry.
  "::ffff:127.0.0.1 ::ffff:7f00:1 ::ffff:169.254.169.254",
);

const NOT_ADDRESSES = [
  "",
  ...addresses(
    "example.org 01.2.3.4 256.1.1.1 1.2.3 1::2::3 12345::1 gggg::1 ::ffff:1.2.3.999",
    "1:2:3:4:5:6:7 1:2:3:4:5:6:7:8:9 1:2:3:4:5:6:7::8 :1:2:3:4:5:6:7",
  ),
];

describe("isPublicAddress", () => {
  it.each(PUBLIC)("accepts the public address %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it.each(NON_PUBLIC)("refuses the non-public address %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(NOT_ADDRESSES)("refuses %j, which is not an address", (text) => {
    expect(isPublicAddress(text)).toBe(false);
  });
});

describe("isIpLiteral", () => {
  it("tells an address from a name", () => {
    expect(["8.8.8.8", "[::1]", "example.org"].map(isIpLiteral)).toEqual([true, true, false]);
  });
});
