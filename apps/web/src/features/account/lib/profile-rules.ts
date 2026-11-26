export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 40;
export const BIO_MAX_LENGTH = 160;

/** A display name is 2–40 characters once the surrounding spaces are removed. */
export function isValidDisplayName(name: string): boolean {
  const { length } = name.trim();
  return length >= DISPLAY_NAME_MIN_LENGTH && length <= DISPLAY_NAME_MAX_LENGTH;
}
