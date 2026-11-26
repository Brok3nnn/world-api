/** Which rule of the egress policy refused a request. */
export type EgressDenialReason =
  | "invalid_url"
  | "not_https"
  | "credentials_in_url"
  | "port_not_allowed"
  | "host_not_allowed"
  | "address_not_public"
  | "rate_limited";

/** A request the egress policy refused before any byte left. */
export interface EgressDenial {
  readonly code: "policy_denied";
  readonly reason: EgressDenialReason;
}

export function denied(reason: EgressDenialReason): EgressDenial {
  return { code: "policy_denied", reason };
}
