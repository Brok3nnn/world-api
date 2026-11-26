import {
  type SourceDefinition,
  sourceDefinitionSchema,
} from "@repo/contracts/source/source-definition";
import type { SourceId } from "@repo/core/ids/id";
import { asc, inArray } from "drizzle-orm";
import type { Database } from "../../client/database";
import { sources } from "../../schema/sources-table";
import { parseStored } from "../parse-stored";
import { storedId } from "../stored-id";

export interface StoredSource {
  readonly id: SourceId;
  readonly definition: SourceDefinition;
}

/** The sources with the given ids, sorted by name. Ids that do not exist are left out. */
export async function getSources(db: Database, ids: readonly SourceId[]): Promise<StoredSource[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await db
    .select()
    .from(sources)
    .where(inArray(sources.id, [...ids]))
    .orderBy(asc(sources.name));
  return rows.map(
    ({ id, created_at: _created, updated_at: _updated, policy_checked_at, ...fields }) => ({
      id: storedId("source", id),
      definition: parseStored(
        sourceDefinitionSchema,
        { ...fields, policy_checked_at: policy_checked_at.toISOString() },
        "source",
      ),
    }),
  );
}
