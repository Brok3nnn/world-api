import type { RandomSource } from "@repo/core/ids/random-source";

/** Thirty-two symbols that are safe in headers and logs and never read as one another. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const RANDOM_LENGTH = 16;

/**
 * The id of one call, for the `x-request-id` header and every log line about it. It is never
 * taken from the request, so a caller cannot make two calls look like one.
 */
export function assignRequestId(random: RandomSource): string {
  // 256 is a multiple of the alphabet size, so every symbol is equally likely.
  const symbols = Array.from(random.bytes(RANDOM_LENGTH), (byte) =>
    ALPHABET.charAt(byte % ALPHABET.length),
  );
  return `req_${symbols.join("")}`;
}
