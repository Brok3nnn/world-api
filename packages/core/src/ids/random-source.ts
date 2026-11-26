/** Source of random bytes. The only way code in this repository obtains randomness. */
export interface RandomSource {
  bytes(length: number): Uint8Array;
}
