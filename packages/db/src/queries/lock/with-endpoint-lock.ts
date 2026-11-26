import type { EndpointId } from "@repo/core/ids/id";
import { sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../client/database";

const answerSchema = z.object({ rows: z.array(z.object({ locked: z.boolean() })).length(1) });

/**
 * Runs `work` while this connection holds the endpoint's advisory lock, released when the work
 * ends, or answers `null` at once when another connection holds it. The lock lives in a
 * transaction, so a crashed holder can never keep it.
 */
export function withEndpointLock<Result>(
  db: Database,
  endpointId: EndpointId,
  work: () => Promise<Result>,
): Promise<Result | null> {
  return db.transaction(async (tx) => {
    const answer = await tx.execute(
      sql`select pg_try_advisory_xact_lock(hashtext(${endpointId})) as locked`,
    );
    const [{ locked } = { locked: false }] = answerSchema.parse(answer).rows;
    return locked ? work() : null;
  });
}
