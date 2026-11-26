/**
 * Whether one more request to a host may be sent now. The policed fetch asks before every
 * request; the caller keeps the counts, per source, from each source's rate limit.
 */
export type SourceRateLimit = (host: string) => boolean;

/** For a command that sends a few requests by hand, once: it never holds one back. */
export const NO_RATE_LIMIT: SourceRateLimit = () => true;
