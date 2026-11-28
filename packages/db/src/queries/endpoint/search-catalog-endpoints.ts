import { err, ok, type Result } from "@repo/core/result";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../../client/database";
import { accounts } from "../../schema/accounts-table";
import { endpoints } from "../../schema/endpoints-table";

/** The most results one page holds, and how deep paging may go. */
export const SEARCH_LIMITS = { pageMax: 50, offsetMax: 500 } as const;

/** One endpoint that matched a search, with what a result list shows of it. */
export interface CatalogMatch {
  readonly owner: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly price_credits: number;
}

const CURSOR = /^offset:(0|[1-9][0-9]{0,2})$/;

function encodeCursor(offset: number): string {
  return Buffer.from(`offset:${offset}`).toString("base64url");
}

/** The offset a cursor of this query stands for, or `null` for any other text. */
function decodeCursor(cursor: string): number | null {
  const match = CURSOR.exec(Buffer.from(cursor, "base64url").toString());
  const offset = match === null ? Number.NaN : Number(match[1]);
  return offset > 0 && offset <= SEARCH_LIMITS.offsetMax ? offset : null;
}

/** The text the search index is built over; it must stay the index's expression word for word. */
const document = sql`to_tsvector('simple', ${endpoints.title} || ' ' || ${endpoints.summary} || ' ' || ${endpoints.category})`;

/**
 * Public endpoints that answer calls and match the words of `query`, best match first. Pages
 * by offset, as the order is a ranking and not a key; the cursor is opaque and bounded, and one
 * this query did not issue is refused. Any text without a NUL character is a valid query.
 */
export async function searchCatalogEndpoints(
  db: Database,
  search: { readonly query: string; readonly limit: number; readonly cursor?: string },
): Promise<
  Result<{ items: CatalogMatch[]; nextCursor: string | null }, { readonly code: "invalid_cursor" }>
> {
  const offset = search.cursor === undefined ? 0 : decodeCursor(search.cursor);
  if (offset === null) {
    return err({ code: "invalid_cursor" });
  }
  const limit = Math.min(Math.max(1, Math.floor(search.limit)), SEARCH_LIMITS.pageMax);
  const words = sql`websearch_to_tsquery('simple', ${search.query})`;
  const rows = await db
    .select({
      owner: accounts.handle,
      slug: endpoints.slug,
      title: endpoints.title,
      summary: endpoints.summary,
      price_credits: endpoints.price_credits,
    })
    .from(endpoints)
    .innerJoin(accounts, eq(accounts.id, endpoints.owner_id))
    .where(
      and(
        eq(endpoints.visibility, "public"),
        inArray(endpoints.status, ["live", "degraded"]),
        sql`${document} @@ ${words}`,
      ),
    )
    .orderBy(desc(sql`ts_rank(${document}, ${words})`), desc(endpoints.created_at), endpoints.id)
    .limit(limit + 1)
    .offset(offset);
  const next = offset + limit;
  const more = rows.length > limit && next <= SEARCH_LIMITS.offsetMax;
  return ok({ items: rows.slice(0, limit), nextCursor: more ? encodeCursor(next) : null });
}
