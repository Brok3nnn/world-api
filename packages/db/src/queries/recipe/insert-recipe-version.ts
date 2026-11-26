import { testReportSchema } from "@repo/contracts/build/test-report";
import { recipeSchema } from "@repo/contracts/recipe/recipe-schema";
import type { BuildId, EndpointId, RecipeVersionId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import type { Database } from "../../client/database";
import { recipeVersions } from "../../schema/recipe-versions-table";

export interface NewRecipeVersion {
  readonly id: RecipeVersionId;
  readonly endpoint_id: EndpointId;
  readonly version: number;
  /** Parsed with the recipe contract before it is written. */
  readonly document: unknown;
  /** Parsed with the test report contract before it is written; absent for a hand-written recipe. */
  readonly test_report?: unknown;
  readonly created_by_build_id?: BuildId;
}

export interface InvalidRecipeVersion {
  readonly code: "invalid_document" | "invalid_test_report";
  /** Where the document breaks its contract, for the builder to repair. */
  readonly issues: readonly string[];
}

/**
 * Adds an inactive recipe version. The document and the test report are parsed with their
 * contracts first, so nothing that breaks them ever reaches the database.
 */
export async function insertRecipeVersion(
  db: Database,
  version: NewRecipeVersion,
): Promise<Result<void, InvalidRecipeVersion>> {
  const document = recipeSchema.safeParse(version.document);
  if (!document.success) {
    return err({
      code: "invalid_document",
      issues: document.error.issues.map((issue) => issue.message),
    });
  }
  const report =
    version.test_report === undefined ? undefined : testReportSchema.safeParse(version.test_report);
  if (report !== undefined && !report.success) {
    return err({
      code: "invalid_test_report",
      issues: report.error.issues.map((issue) => issue.message),
    });
  }
  await db.insert(recipeVersions).values({
    id: version.id,
    endpoint_id: version.endpoint_id,
    version: version.version,
    document: document.data,
    test_report: report?.data,
    created_by_build_id: version.created_by_build_id,
  });
  return ok(undefined);
}
