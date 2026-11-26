import { isPublicIpv4, parseIpv4 } from "./ipv4-address";

const GROUPS = 8;
const GROUP = /^[0-9a-f]{1,4}$/i;
const HEX = 16;

function parseGroups(part: string): number[] | null {
  if (part === "") {
    return [];
  }
  const groups = part.split(":");
  return groups.every((group) => GROUP.test(group))
    ? groups.map((group) => Number.parseInt(group, HEX))
    : null;
}

/** Rewrites a dotted IPv4 tail, as in `::ffff:192.0.2.1`, into two hexadecimal groups. */
function withHexTail(text: string): string | null {
  const tailStart = text.lastIndexOf(":") + 1;
  const tail = text.slice(tailStart);
  if (!tail.includes(".")) {
    return text;
  }
  const address = parseIpv4(tail);
  if (address === null) {
    return null;
  }
  return `${text.slice(0, tailStart)}${(address >>> HEX).toString(HEX)}:${(address & 0xffff).toString(HEX)}`;
}

/** An IPv6 address in any valid text form as its eight 16-bit groups, or `null`. */
export function parseIpv6(text: string): number[] | null {
  const hex = withHexTail(text);
  const halves = hex?.split("::") ?? [];
  if (halves.length < 1 || halves.length > 2) {
    return null;
  }
  const left = parseGroups(halves[0] ?? "");
  const right = parseGroups(halves[1] ?? "");
  if (left === null || right === null) {
    return null;
  }
  if (halves.length === 1) {
    return left.length === GROUPS ? left : null;
  }
  const missing = GROUPS - left.length - right.length;
  return missing >= 1 ? [...left, ...new Array<number>(missing).fill(0), ...right] : null;
}

/**
 * Only global unicast (`2000::/3`) is public, minus the blocks inside it that are not reachable
 * hosts or that tunnel to an IPv4 address of any kind. An IPv4-mapped address is judged as the
 * IPv4 address it carries.
 */
export function isPublicIpv6(groups: readonly number[]): boolean {
  const [first = 0, second = 0] = groups;
  const mapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mapped) {
    return isPublicIpv4((((groups[6] ?? 0) << HEX) | (groups[7] ?? 0)) >>> 0);
  }
  const blocked =
    (first & 0xe000) !== 0x2000 || // outside global unicast: loopback, link-local, unique local, multicast, NAT64
    (first === 0x2001 && second < 0x0200) || // protocol assignments, including Teredo
    (first === 0x2001 && second === 0x0db8) || // documentation
    first === 0x2002 || // 6to4, which can carry any IPv4 address
    (first === 0x3fff && second < 0x1000); // documentation
  return !blocked;
}
