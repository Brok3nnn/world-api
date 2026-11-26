import type { Envelope } from "@repo/contracts/api/envelope";
import type { EndpointId, RecipeVersionId, ValueId } from "@repo/core/ids/id";

/** A value a refresh produced, and when it was observed, fetched and stops being fresh. */
export interface StoredValue {
  readonly data: Envelope["data"];
  readonly asOf: Date;
  readonly fetchedAt: Date;
  readonly expiresAt: Date;
  readonly recipeVersionId: RecipeVersionId;
}

/** The refresh state of an endpoint: its value, if it has one, and its failures in a row. */
export interface LatestValue {
  readonly value: StoredValue | null;
  readonly consecutiveFailures: number;
}

/** One past value, kept in the endpoint's history. */
export interface HistoryEntry {
  readonly id: ValueId;
  readonly endpointId: EndpointId;
  readonly data: Envelope["data"];
  readonly asOf: Date;
  readonly recipeVersionId: RecipeVersionId;
}

/** Reads and writes the latest value of endpoints, and appends to their history. */
export interface ValueStore {
  /** The latest value; an endpoint never refreshed has none and no failures. */
  readLatest(endpointId: EndpointId): Promise<LatestValue>;
  /** Replaces the latest value and clears the failure count. */
  storeRefreshed(endpointId: EndpointId, value: StoredValue): Promise<void>;
  appendHistory(entry: HistoryEntry): Promise<void>;
  /**
   * Counts a failed refresh and keeps the value, so it can be served within its grace period.
   * `error` is a code and a step, never a value. Returns the failures in a row, this one included.
   */
  recordFailure(endpointId: EndpointId, error: string): Promise<number>;
}
