import { buildEventSchema } from "@repo/contracts/build/build-event";
import type { BuildEventId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import type { Database } from "../../client/database";
import { buildEvents } from "../../schema/build-events-table";

const newEventSchema = buildEventSchema.omit({ at: true });

/** Adds one step to a build's story, after it passes the build event contract. */
export async function appendBuildEvent(
  db: Database,
  event: { readonly id: BuildEventId; readonly event: unknown },
): Promise<Result<void, { readonly code: "invalid_event" }>> {
  const parsed = newEventSchema.safeParse(event.event);
  if (!parsed.success) {
    return err({ code: "invalid_event" });
  }
  await db.insert(buildEvents).values({ id: event.id, ...parsed.data });
  return ok(undefined);
}
