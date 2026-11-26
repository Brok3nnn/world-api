const OCTET = /^(0|[1-9][0-9]{0,2})$/;
const OCTET_MAX = 255;
const OCTET_VALUES = 256;
const BITS = 32;

function fromOctets(octets: readonly number[]): number {
  return octets.reduce((address, octet) => address * OCTET_VALUES + octet, 0);
}

/**
 * Ranges that are not on the public internet, as base and prefix length. Requests to them could
 * reach the platform's own network, a cloud metadata service or nothing at all.
 */
const NON_PUBLIC_RANGES: readonly (readonly [number, number])[] = [
  [fromOctets([0, 0, 0, 0]), 8], // "this" network
  [fromOctets([10, 0, 0, 0]), 8], // private
  [fromOctets([100, 64, 0, 0]), 10], // shared address space of carrier-grade NAT
  [fromOctets([127, 0, 0, 0]), 8], // loopback
  [fromOctets([169, 254, 0, 0]), 16], // link-local, including the metadata address 169.254.169.254
  [fromOctets([172, 16, 0, 0]), 12], // private
  [fromOctets([192, 0, 0, 0]), 24], // protocol assignments
  [fromOctets([192, 0, 2, 0]), 24], // documentation
  [fromOctets([192, 88, 99, 0]), 24], // former 6to4 relays
  [fromOctets([192, 168, 0, 0]), 16], // private
  [fromOctets([198, 18, 0, 0]), 15], // benchmarking
  [fromOctets([198, 51, 100, 0]), 24], // documentation
  [fromOctets([203, 0, 113, 0]), 24], // documentation
  [fromOctets([224, 0, 0, 0]), 4], // multicast
  [fromOctets([240, 0, 0, 0]), 4], // reserved, including broadcast
];

/**
 * An IPv4 address in dotted decimal as a 32-bit number, or `null` when the text is not one.
 * Octets with a leading zero are refused: some parsers read them as octal.
 */
export function parseIpv4(text: string): number | null {
  const octets = text.split(".");
  const valid =
    octets.length === 4 && octets.every((octet) => OCTET.test(octet) && Number(octet) <= OCTET_MAX);
  return valid ? fromOctets(octets.map(Number)) : null;
}

export function isPublicIpv4(address: number): boolean {
  return NON_PUBLIC_RANGES.every(([base, prefix]) => {
    const mask = (~0 << (BITS - prefix)) >>> 0;
    return (address & mask) >>> 0 !== base;
  });
}
