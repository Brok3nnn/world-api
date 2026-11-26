import type { CoverId } from "../types";

/** Public path of a cover photo. */
export function coverSrc(cover: CoverId): string {
  return `/covers/${cover}.jpg`;
}
