import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** An owner of endpoints, or a caller: the platform account `@core`, or a person. */
export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    handle: text("handle").notNull().unique(),
    display_name: text("display_name").notNull(),
    kind: text("kind", { enum: ["platform", "user"] }).notNull(),
    /** The sign-in identity behind the account; the platform account has none. */
    auth_user_id: uuid("auth_user_id").unique(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("accounts_id_prefix", sql`${table.id} ~ '^acc_[0-9a-z_]{1,64}$'`),
    check("accounts_handle_format", sql`${table.handle} ~ '^[a-z0-9_]{2,32}$'`),
    check("accounts_kind", sql`${table.kind} in ('platform', 'user')`),
  ],
).enableRLS();
