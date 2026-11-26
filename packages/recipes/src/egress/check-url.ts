import { err, ok, type Result } from "@repo/core/result";
import { denied, type EgressDenial } from "./egress-denial";
import { isIpLiteral, isPublicAddress } from "./is-public-address";

/** The host a URL names, as the allow-list writes it: lowercase, without a final dot. */
function hostOf(url: URL): string {
  return url.hostname.endsWith(".") ? url.hostname.slice(0, -1) : url.hostname;
}

/**
 * Checks a URL against the egress policy before anything is resolved or sent: `https` on its
 * standard port, no credentials, and a host on the allow-list of the endpoint's sources. A host
 * written as an address must be public, and is still refused unless it is on the list.
 */
export function checkUrl(url: string, allowedHosts: readonly string[]): Result<URL, EgressDenial> {
  const parsed = URL.parse(url);
  if (parsed === null) {
    return err(denied("invalid_url"));
  }
  if (parsed.protocol !== "https:") {
    return err(denied("not_https"));
  }
  if (parsed.username !== "" || parsed.password !== "") {
    return err(denied("credentials_in_url"));
  }
  if (parsed.port !== "") {
    return err(denied("port_not_allowed"));
  }
  const host = hostOf(parsed);
  if (isIpLiteral(host) && !isPublicAddress(host)) {
    return err(denied("address_not_public"));
  }
  return allowedHosts.includes(host) ? ok(parsed) : err(denied("host_not_allowed"));
}
