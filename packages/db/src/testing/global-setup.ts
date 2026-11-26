import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { buildMigratedImage } from "./migrated-image";

/**
 * Runs once before all test files of a workspace: migrates one database and writes its image
 * to a temporary file that every test file copies from. Without it, each test file would
 * migrate its own database at the same moment, which is slow enough under load to time out.
 * List it under `globalSetup` in the test configuration of any workspace that uses
 * `createTestDatabase`.
 */
export async function setup(project: TestProject): Promise<() => Promise<void>> {
  const folder = await mkdtemp(join(tmpdir(), "migrated-database-"));
  const path = join(folder, "image.tar");
  const image = await buildMigratedImage();
  await writeFile(path, new Uint8Array(await image.arrayBuffer()));
  project.provide("migratedDatabaseImage", path);
  return () => rm(folder, { recursive: true, force: true });
}
