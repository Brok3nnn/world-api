import { defineConfig } from "vitest/config";

/** Coverage floor of this package; see docs/testing.md. */
const COVERAGE_FLOOR = 95;

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/**/*.ts"],
      // Entries that only wire adapters and start are proven by running them (testing.md, Coverage).
      exclude: ["src/**/*.test.ts", "src/**/testing/**", "src/**/*-command.ts"],
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
