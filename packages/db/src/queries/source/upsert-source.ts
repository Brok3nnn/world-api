import { sourceDefinitionSchema } from "@repo/contracts/source/source-definition";
import type { SourceId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { sources } from "../../schema/sources-table";
import { storedId } from "../stored-id";

/**
 * Records an approved source, or updates the one with the same name. The definition is parsed
 * with the source contract first. Returns the id of the stored source: the existing one when
 * the name was already known, so links from endpoints stay valid.
 */
export async function upsertSource(
  db: Database,
  source: { readonly id: SourceId; readonly definition: unknown },
): Promise<
  Result<SourceId, { readonly code: "invalid_source"; readonly issues: readonly string[] }>
> {
  const parsed = sourceDefinitionSchema.safeParse(source.definition);
  if (!parsed.success) {
    return err({
      code: "invalid_source",
      issues: parsed.error.issues.map((issue) => issue.message),
    });
  }
  const { policy_checked_at, ...definition } = parsed.data;
  const row = { ...definition, policy_checked_at: new Date(policy_checked_at) };
  const [stored] = await db
    .insert(sources)
    .values({ id: source.id, ...row })
    .onConflictDoUpdate({ target: sources.name, set: { ...row, updated_at: sql`now()` } })
    .returning({ id: sources.id });
  if (stored === undefined) {
    throw new Error("The database returned no row for an upsert.");
  }
  return ok(storedId("source", stored.id));
}
