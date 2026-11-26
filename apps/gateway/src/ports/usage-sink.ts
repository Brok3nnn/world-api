import type { ErrorCode } from "@repo/contracts/api/error";
import type { Shape } from "@repo/contracts/api/shape";
import type { AccountId, EndpointId, UsageEventId } from "@repo/core/ids/id";
import type { Result } from "@repo/core/result";

/** One call of an endpoint: how it ended, what it cost and how long it took. No address, no query. */
export interface UsageEvent {
  readonly id: UsageEventId;
  readonly endpointId: EndpointId;
  /** The account that called; `null` for an anonymous call. */
  readonly callerId: AccountId | null;
  readonly outcome: "served" | ErrorCode;
  readonly shape: Shape;
  /** What the call cost; nothing for any answer but a served value. */
  readonly priceCredits: number;
  readonly latencyMs: number;
  readonly refreshed: boolean;
}

/** Records usage events. A failure is reported, never thrown: usage must not break a call. */
export interface UsageSink {
  record(event: UsageEvent): Promise<Result<void, { readonly code: "unrecorded" }>>;
}
