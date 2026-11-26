import type { CallerDirectory } from "../../ports/caller-directory";

/** The only callers before accounts exist: anonymous, limited by their network address. */
export function createAnonymousCallerDirectory(): CallerDirectory {
  return {
    identify: async (_request, client) => ({
      kind: "anonymous",
      limitKey: `address:${client.address}`,
    }),
  };
}
