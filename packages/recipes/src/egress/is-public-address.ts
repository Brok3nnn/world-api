import { isPublicIpv4, parseIpv4 } from "./ipv4-address";
import { isPublicIpv6, parseIpv6 } from "./ipv6-address";

/** The address inside the brackets a URL puts around an IPv6 host. */
function unbracketed(text: string): string {
  return text.startsWith("[") && text.endsWith("]") ? text.slice(1, -1) : text;
}

/** Whether a host is written as an address instead of a name. */
export function isIpLiteral(host: string): boolean {
  return parseIpv4(host) !== null || host.startsWith("[");
}

/**
 * Whether an address, IPv4 or IPv6, belongs to the public internet. Text that is not an address
 * is never public, so an unexpected form is refused instead of trusted.
 */
export function isPublicAddress(text: string): boolean {
  const ipv4 = parseIpv4(text);
  if (ipv4 !== null) {
    return isPublicIpv4(ipv4);
  }
  const ipv6 = parseIpv6(unbracketed(text));
  return ipv6 !== null && isPublicIpv6(ipv6);
}
