import type { Category } from "@repo/contracts/endpoint/category";
import type { EndpointId } from "@repo/core/ids/id";
import { err, ok, type Result } from "@repo/core/result";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../client/database";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";
import { storedId } from "../stored-id";

/** The most endpoints one page may hold, whatever the caller asks for. */
export const CATALOG_PAGE_MAX = 100;

/** An endpoint as a catalog page shows it. */
export interface CatalogEndpoint {
  readonly id: EndpointId;
  readonly owner: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: Category;
  readonly price_credits: number;
}

export interface CatalogPage {
  readonly items: readonly CatalogEndpoint[];
  /** Pass back as `cursor` for the next page; `null` on the last page. */
  readonly nextCursor: string | null;
}

/**
 * Where a page ends: the creation time of its last endpoint, as Postgres writes it with every
 * microsecond, and its id. A JavaScript date would drop the microseconds and repeat rows.
 */
const positionSchema = z.strictObject({
  created_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?[+-]\d{2}(:\d{2})?$/),
  id: z.string().min(1).max(80),
});

const createdAtText = sql<string>`${endpoints.created_at}::text`;

function encodeCursor(position: z.infer<typeof positionSchema>): string {
  return Buffer.from(JSON.stringify(position)).toString("base64url");
}

function decodeCursor(cursor: string): z.infer<typeof positionSchema> | undefined {
  try {
    const parsed = positionSchema.safeParse(
      JSON.parse(Buffer.from(cursor, "base64url").toString()),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/**
 * One page of the public catalog: public endpoints that answer calls, newest first. A cursor
 * that was not produced by this function is refused.
 */
export async function listCatalogEndpoints(
  db: Database,
  page: { readonly limit: number; readonly cursor?: string },
): Promise<Result<CatalogPage, { readonly code: "invalid_cursor" }>> {
  const after = page.cursor === undefined ? undefined : decodeCursor(page.cursor);
  if (page.cursor !== undefined && after === undefined) {
    return err({ code: "invalid_cursor" });
  }
  const limit = Math.min(Math.max(1, Math.floor(page.limit)), CATALOG_PAGE_MAX);
  const rows = await db
    .select({ endpoint: endpoints, owner: accounts.handle, position: createdAtText })
    .from(endpoints)
    .innerJoin(accounts, eq(accounts.id, endpoints.owner_id))
    .where(
      and(
        eq(endpoints.visibility, "public"),
        inArray(endpoints.status, ["live", "degraded"]),
        after === undefined
          ? undefined
          : or(
              lt(endpoints.created_at, sql`${after.created_at}::timestamptz`),
              and(
                eq(endpoints.created_at, sql`${after.created_at}::timestamptz`),
                lt(endpoints.id, after.id),
              ),
            ),
      ),
    )
    .orderBy(desc(endpoints.created_at), desc(endpoints.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit).map(({ endpoint, owner }) => ({
    id: storedId("endpoint", endpoint.id),
    owner,
    slug: endpoint.slug,
    title: endpoint.title,
    summary: endpoint.summary,
    category: endpoint.category,
    price_credits: endpoint.price_credits,
  }));
  const last = rows[limit - 1];
  const nextCursor =
    rows.length > limit && last !== undefined
      ? encodeCursor({ created_at: last.position, id: last.endpoint.id })
      : null;
  return ok({ items, nextCursor });
}
