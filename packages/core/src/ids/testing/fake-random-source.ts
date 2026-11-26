import type { RandomSource } from "../random-source";

const BYTE_VALUES = 256;

/** Predictable bytes that count up from `seed`, so every run of a test sees the same ids. */
export function createFakeRandomSource(seed = 0): RandomSource {
  let next = seed;
  return {
    bytes(length) {
      const bytes = new Uint8Array(length);
      for (let index = 0; index < length; index += 1) {
        bytes[index] = next % BYTE_VALUES;
        next += 1;
      }
      return bytes;
    },
  };
}
