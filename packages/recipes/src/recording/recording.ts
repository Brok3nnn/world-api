/**
 * One source response kept as a file, so tests can replay it without the network. It holds what
 * a replay needs and nothing else: no headers, no address, no timing.
 */
export interface Recording {
  readonly url: string;
  readonly status: number;
  /** The media type, as the policed fetch reports it. */
  readonly contentType: string | null;
  readonly body: string;
}
