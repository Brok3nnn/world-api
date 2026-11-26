import { describe, expect, it } from "vitest";
import { accounts } from "../schema/accounts-table";
import { openInProcessDatabase } from "./in-process-database";

describe("openInProcessDatabase", () => {
  it("opens an empty database with every migration applied", async () => {
    const { db, close } = await openInProcessDatabase();
    try {
      expect(await db.select().from(accounts)).toEqual([]);
    } finally {
      await close();
    }
  });
});
