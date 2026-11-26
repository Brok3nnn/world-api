/** Whether a call that costs `priceCredits` is more expensive than the caller's `max_price`. */
export function exceedsPriceCap(priceCredits: number, maxPriceCredits: number): boolean {
  return priceCredits > maxPriceCredits;
}
