import { ID_PREFIXES, type IdKind } from "@repo/contracts/ids";
import type { Clock } from "../time/clock";
import type { Id } from "./id";
import type { IdGenerator } from "./id-generator";
import type { RandomSource } from "./random-source";

/** Thirty-two symbols that are safe in URLs and never read as one another. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
/** Ten symbols hold fifty bits: milliseconds for tens of thousands of years. */
const TIME_LENGTH = 10;
/** Sixteen symbols hold eighty random bits. */
const RANDOM_LENGTH = 16;

interface IdGeneratorDeps {
  readonly clock: Clock;
  readonly random: RandomSource;
}

function encodeTime(milliseconds: number): string {
  let remaining = milliseconds;
  let encoded = "";
  for (let position = 0; position < TIME_LENGTH; position += 1) {
    encoded = ALPHABET.charAt(remaining % ALPHABET.length) + encoded;
    remaining = Math.floor(remaining / ALPHABET.length);
  }
  return encoded;
}

function encodeRandom(bytes: Uint8Array): string {
  if (bytes.length !== RANDOM_LENGTH) {
    throw new Error(`Random source returned ${bytes.length} bytes, expected ${RANDOM_LENGTH}.`);
  }
  // 256 is a multiple of the alphabet size, so every symbol is equally likely.
  return Array.from(bytes, (byte) => ALPHABET.charAt(byte % ALPHABET.length)).join("");
}

/**
 * Ids made of the kind's prefix, a part that sorts by creation time and a random part:
 * `ep_01jd3k8m4q` followed by sixteen random symbols. Ids created in different milliseconds
 * sort in the order they were created.
 */
export function createIdGenerator(deps: IdGeneratorDeps): IdGenerator {
  return {
    newId<Kind extends IdKind>(kind: Kind): Id<Kind> {
      const time = encodeTime(deps.clock.now().getTime());
      const random = encodeRandom(deps.random.bytes(RANDOM_LENGTH));
      // Safe: built from this kind's prefix and the id alphabet, the shape `parseId` accepts.
      return `${ID_PREFIXES[kind]}_${time}${random}` as Id<Kind>;
    },
  };
}
