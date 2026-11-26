import { matchesAllTerms } from "@/lib/text-search";
import type { Publisher } from "../types";

/** True when every term of `query` appears in the publisher's handle, name or bio. */
export function matchesPublisher(publisher: Publisher, query: string): boolean {
  return matchesAllTerms(`@${publisher.handle} ${publisher.displayName} ${publisher.bio}`, query);
}
