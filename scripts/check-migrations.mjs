// @ts-check
/*
 * Fails when the database schema has changed without a migration. It runs the migration
 * generator against packages/db, compares the migrations folder before and after, and restores
 * it, so the check never leaves files behind.
 *
 * Usage: node scripts/check-migrations.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGE_DIR = "packages/db";
const MIGRATIONS_DIR = join(PACKAGE_DIR, "migrations");
const PROBE_NAME = "unsaved_schema_change";
/** What the generator prints when the schema matches the migrations. */
const NO_CHANGES = "No schema changes";

/** Every file of the migrations folder, with its content. @param {string} folder */
function readFolder(folder) {
  /** @type {Map<string, string>} */
  const files = new Map();
  if (!existsSync(folder)) {
    return files;
  }
  for (const entry of readdirSync(folder, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) {
      const path = join(entry.parentPath, entry.name);
      files.set(path, readFileSync(path, "utf8"));
    }
  }
  return files;
}

const before = readFolder(MIGRATIONS_DIR);
// The generator can report an error and still exit with 0, so its output decides.
const output = execFileSync(
  "pnpm",
  ["--filter", "@repo/db", "migrations:generate", `--name=${PROBE_NAME}`],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const after = readFolder(MIGRATIONS_DIR);

const changed = [...after].filter(([path, content]) => before.get(path) !== content);
for (const [path] of changed) {
  const original = before.get(path);
  if (original === undefined) {
    rmSync(path);
  } else {
    writeFileSync(path, original);
  }
}

if (changed.length === 0 && !output.includes(NO_CHANGES)) {
  process.stderr.write(`Migration check failed: the generator did not run cleanly.\n${output}\n`);
  process.exit(1);
}
if (changed.length > 0) {
  process.stderr.write(
    "Migration check failed: the schema in packages/db/src/schema has changes without a\n" +
      "migration. Run `pnpm --filter @repo/db migrations:generate --name=<what-changed>`,\n" +
      "read the generated SQL and commit it.\n",
  );
  process.exit(1);
}
process.stdout.write("Migration check passed.\n");
