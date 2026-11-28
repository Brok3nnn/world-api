import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const QUERIES = fileURLToPath(new URL(".", import.meta.url));
/** The tables the data model declares append-only, by their schema names in code. */
const APPEND_ONLY = ["valuesHistory", "usageEvents", "buildEvents"];

function querySources(): { file: string; source: string }[] {
  return readdirSync(QUERIES, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => ({ file, source: readFileSync(join(QUERIES, file), "utf8") }));
}

describe("append-only tables", () => {
  it("are read by at least one query module, so this check has something to look at", () => {
    expect(querySources().length).toBeGreaterThan(0);
  });

  it.each(APPEND_ONLY)("%s is never updated or deleted by a query", (table) => {
    const writes = new RegExp(`\\.(update|delete)\\(\\s*${table}\\b`);

    expect(
      querySources()
        .filter(({ source }) => writes.test(source))
        .map(({ file }) => file),
    ).toEqual([]);
  });
});
