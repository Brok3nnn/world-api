import { exceedsPriceCap } from "@repo/core/pricing/exceeds-price-cap";
import { err, ok, type Result } from "@repo/core/result";
import type { ServedEndpoint } from "../ports/endpoint-directory";
import type { ErrorAnswer } from "../responses/error-response";

/**
 * Refuses a call that costs more than its `max_price` with `402 payment_required`, before
 * anything is read or refreshed. Nothing is charged yet; the price is only reported.
 */
export function guardPrice(
  endpoint: ServedEndpoint,
  maxPriceCredits: number | undefined,
): Result<void, ErrorAnswer> {
  const price = endpoint.definition.price_credits;
  if (maxPriceCredits === undefined || !exceedsPriceCap(price, maxPriceCredits)) {
    return ok(undefined);
  }
  return err({
    code: "payment_required",
    message: "This call costs more than max_price.",
    hint: `It costs ${price} ${price === 1 ? "credit" : "credits"}; raise max_price or leave it out.`,
  });
}
