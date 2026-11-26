import { integerText } from "./integer-text";

/** The largest cap a caller may name, far above any price. */
const MAX_PRICE_LIMIT_CREDITS = 1_000_000;

/**
 * `max_price`: the most credits a caller accepts for one answer, as a whole number in text form.
 * A more expensive answer is refused instead of served.
 */
export const maxPriceSchema = integerText({ min: 0, max: MAX_PRICE_LIMIT_CREDITS });
