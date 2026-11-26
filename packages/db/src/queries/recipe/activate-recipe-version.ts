import type { EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { and, eq, ne, sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { recipeVersions } from "../../schema/recipe-versions-table";

/**
 * Makes one version the active recipe of its endpoint and every other version inactive, in one
 * transaction: a call sees either the previous active version or the new one, never none.
 */
export function activateRecipeVersion(
  db: Database,
  target: { readonly endpoint_id: EndpointId; readonly version_id: RecipeVersionId },
): Promise<Result<void, { readonly code: "not_found" }>> {
  const ofEndpoint = eq(recipeVersions.endpoint_id, target.endpoint_id);
  return db.transaction(async (tx) => {
    const [version] = await tx
      .select({ id: recipeVersions.id })
      .from(recipeVersions)
      .where(and(ofEndpoint, eq(recipeVersions.id, target.version_id)))
      .for("update");
    if (version === undefined) {
      return err({ code: "not_found" });
    }
    await tx
      .update(recipeVersions)
      .set({ active: false, updated_at: sql`now()` })
      .where(and(ofEndpoint, eq(recipeVersions.active, true), ne(recipeVersions.id, version.id)));
    await tx
      .update(recipeVersions)
      .set({ active: true, updated_at: sql`now()` })
      .where(eq(recipeVersions.id, version.id));
    return ok(undefined);
  });
}
