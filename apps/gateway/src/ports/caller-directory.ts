import type { ClientConnection } from "../routes/route";

/** Who is calling, as far as limits and prices are concerned. Keys arrive with accounts. */
export interface Caller {
  readonly kind: "anonymous";
  /** What the caller's rate limit is counted by. */
  readonly limitKey: string;
}

/** Tells who a call comes from. */
export interface CallerDirectory {
  identify(request: Request, client: ClientConnection): Promise<Caller>;
}
