// @ts-check
/*
 * Writes the OpenAPI document that packages/contracts generates from its schemas. With
 * `--check` it writes nothing and fails when the committed document differs from what the
 * contracts generate now, so a schema change without a regenerated document cannot pass
 * `pnpm check`. The document is never edited by hand (docs/architecture/api.md).
 *
 * Usage: node --import ./scripts/resolve-ts.mjs scripts/openapi.mjs [--check]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { openApiText } from "@repo/contracts/openapi/openapi-document";

const DOCUMENT = "packages/contracts/openapi.json";

const generated = openApiText();

if (!process.argv.includes("--check")) {
  writeFileSync(DOCUMENT, generated);
  process.stdout.write(`Wrote ${DOCUMENT}.\n`);
  process.exit(0);
}
const committed = existsSync(DOCUMENT) ? readFileSync(DOCUMENT, "utf8") : "";
if (committed !== generated) {
  process.stderr.write(
    `OpenAPI check failed: ${DOCUMENT} does not match the contract schemas.\n` +
      "Run `pnpm openapi` and commit the result.\n",
  );
  process.exit(1);
}
process.stdout.write("OpenAPI check passed.\n");
