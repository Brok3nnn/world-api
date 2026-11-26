import { buildRequestSchema } from "@repo/contracts/build/build-request";
import type { AccountId, BuildId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import type { Database } from "../../client/database";
import { builds } from "../../schema/builds-table";

/** Queues a build for a request, after the request passes its contract. */
export async function createBuild(
  db: Database,
  build: { readonly id: BuildId; readonly requester_id: AccountId; readonly request: unknown },
): Promise<Result<void, { readonly code: "invalid_request"; readonly issues: readonly string[] }>> {
  const request = buildRequestSchema.safeParse(build.request);
  if (!request.success) {
    return err({
      code: "invalid_request",
      issues: request.error.issues.map((issue) => issue.message),
    });
  }
  await db
    .insert(builds)
    .values({ id: build.id, requester_id: build.requester_id, request: request.data });
  return ok(undefined);
}
