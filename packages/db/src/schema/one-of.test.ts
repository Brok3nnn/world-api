import { PgDialect, pgTable, text } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { oneOf } from "./one-of";

const table = pgTable("examples", { kind: text("kind") });

describe("oneOf", () => {
  it("writes the list into the check as literals", () => {
    const query = new PgDialect().sqlToQuery(oneOf(table.kind, ["a", "b"]));

    expect(query).toEqual({ sql: `"examples"."kind" in ('a', 'b')`, params: [] });
  });

  it("doubles a quote inside a value", () => {
    const query = new PgDialect().sqlToQuery(oneOf(table.kind, ["it's"]));

    expect(query.sql).toBe(`"examples"."kind" in ('it''s')`);
  });
});
