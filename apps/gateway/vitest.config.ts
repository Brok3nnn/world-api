import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Coverage floor of this app; see docs/testing.md. */
const COVERAGE_FLOOR = 90;

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The adapter tests copy one database migrated once for the run, as `@repo/db` itself does.
    globalSetup: [fileURLToPath(import.meta.resolve("@repo/db/testing/global-setup"))],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/**/*.ts"],
      // Entries that only wire adapters and start are proven by running them (testing.md, Coverage).
      exclude: [
        "src/**/*.test.ts",
        "src/**/testing/**",
        "src/entry/node.ts",
        "src/**/*-command.ts",
      ],
      reporter: ["text-summary"],
      thresholds: {
        lines: COVERAGE_FLOOR,
        branches: COVERAGE_FLOOR,
        functions: COVERAGE_FLOOR,
        statements: COVERAGE_FLOOR,
      },
    },
  },
});
