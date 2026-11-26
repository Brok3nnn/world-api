import type { SourceTier } from "@repo/contracts/source/source-tier";
import { secondsBetween } from "../time/duration";

/** How long a check of a source's terms stays valid: 90 days (security.md, Source tiers). */
export const POLICY_CHECK_VALID_S = 90 * 86_400;

/**
 * Whether a run may read a source: it is `green` and its terms were checked within 90 days. An
 * older check counts as `yellow` until it is renewed, and `yellow` needs conditions the engine
 * cannot enforce yet.
 */
export function isUsableSource(
  source: { readonly tier: SourceTier; readonly policyCheckedAt: Date },
  now: Date,
): boolean {
  return (
    source.tier === "green" && secondsBetween(source.policyCheckedAt, now) < POLICY_CHECK_VALID_S
  );
}
