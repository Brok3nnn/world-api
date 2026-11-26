import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import type { TestDatabase } from "./create-test-database";

/** What a test asserts about a table: what the schema declares and what Postgres enforces. */
export async function tableFacts(database: TestDatabase, table: PgTable) {
  const config = getTableConfig(table);
  const constraints = await database.query(
    "select conname, contype from pg_constraint where conrelid = $1::regclass order by conname",
    [config.name],
  );
  const indexes = await database.query(
    "select indexname from pg_indexes where tablename = $1 order by indexname",
    [config.name],
  );
  const unindexed = await database.query(
    `select c.conname from pg_constraint c
     where c.conrelid = $1::regclass and c.contype = 'f' and not exists (
       select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]
     )
     order by c.conname`,
    [config.name],
  );
  const [security] = await database.query(
    "select relrowsecurity from pg_class where oid = $1::regclass",
    [config.name],
  );
  return {
    declaredChecks: config.checks.map((check) => check.name).sort(),
    enforcedChecks: constraints.filter((row) => row.contype === "c").map((row) => row.conname),
    declaredForeignKeys: config.foreignKeys.map((foreignKey) => foreignKey.getName()).sort(),
    enforcedForeignKeys: constraints.filter((row) => row.contype === "f").map((row) => row.conname),
    constraints: constraints.map((row) => row.conname),
    indexes: indexes.map((row) => row.indexname),
    /** Foreign keys whose column does not lead any index; the rules allow none. */
    unindexedForeignKeys: unindexed.map((row) => row.conname),
    rowLevelSecurity: security?.relrowsecurity,
  };
}
