/** Every event the gateway logs. A new event is added here first (operations.md, Logging). */
export const LOG_EVENTS = {
  /** A defect turned into `500 internal_error`: a person needs to look. */
  defect: "call.defect",
  /** A refresh produced no value: the endpoint is served within its grace period, or degraded. */
  refreshFailed: "refresh.failed",
  /** A refresh moved an endpoint between `live` and `degraded`. */
  statusChanged: "endpoint.status.changed",
  /** A usage event could not be written; the call it describes was answered as usual. */
  usageUnrecorded: "usage.unrecorded",
  /** No refresh may read a source, for example because its terms were checked too long ago. */
  sourceUnusable: "source.unusable",
  /** The Node entry is listening. */
  started: "gateway.started",
} as const;
