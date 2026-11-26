import { defineConfig } from "vitest/config";

/** Coverage floor of this package; see docs/testing.md. */
const COVERAGE_FLOOR = 90;

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["./src/testing/global-setup.ts"],
    // Each test copies an in-process Postgres, which is CPU-heavy; more parallel files make
    // every file slower (measured: 3 workers finish in 20 s, 10 workers in 27 s).
    maxWorkers: 3,
    coverage: {
      enabled: true,
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/testing/**"],
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
