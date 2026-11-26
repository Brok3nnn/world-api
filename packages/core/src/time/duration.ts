const MILLISECONDS_PER_SECOND = 1000;

/** The instant `seconds` after `instant`; a negative number of seconds gives an earlier one. */
export function addSeconds(instant: Date, seconds: number): Date {
  return new Date(instant.getTime() + seconds * MILLISECONDS_PER_SECOND);
}

/** Whole seconds from `earlier` to `later`, rounded down; negative when `later` is earlier. */
export function secondsBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / MILLISECONDS_PER_SECOND);
}
