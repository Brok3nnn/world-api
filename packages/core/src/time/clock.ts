/** Source of the current time. The only way code in this repository reads the clock. */
export interface Clock {
  now(): Date;
}
