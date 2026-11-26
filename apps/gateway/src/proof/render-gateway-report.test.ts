import { describe, expect, it } from "vitest";
import type { Demonstration } from "./proof-world";
import { renderGatewayReport } from "./render-gateway-report";

const DEGRADED: Demonstration = {
  title: "A failing source degrades the endpoint without a charge",
  verdict: "pass",
  findings: ["@core/x answered 503 degraded."],
  exchanges: [
    {
      path: "/@core/x",
      status: 503,
      contentType: "application/json",
      retryAfter: "900",
      body: '{"error":{"code":"degraded"}}',
    },
  ],
};

function render(demonstration: Demonstration, verdict: "pass" | "failed") {
  return renderGatewayReport({
    demonstrations: [demonstration],
    commit: "abc1234",
    ranAt: new Date("2026-11-23T00:00:00.000Z"),
    verdict,
  });
}

describe("renderGatewayReport", () => {
  it("shows the verdict, each finding and each request with what came back", () => {
    const report = render(DEGRADED, "pass");
    expect(report).toContain("| Verdict | **PASS** |");
    expect(report).toContain("- @core/x answered 503 degraded.");
    expect(report).toContain(
      '| `/@core/x` | 503, retry after 900 s | application/json | `{"error":{"code":"degraded"}}` |',
    );
  });

  it("keeps a body on one row: line breaks and pipes escaped, long bodies cut", () => {
    const exchange = {
      path: "/@core/x?shape=csv",
      status: 200,
      contentType: null,
      retryAfter: null,
    };
    const report = render(
      { ...DEGRADED, exchanges: [{ ...exchange, body: `a|b\r\n${"c".repeat(200)}` }] },
      "failed",
    );
    expect(report).toContain("| Verdict | **FAIL** |");
    expect(report).toContain(`| 200 | — | \`a\\|b ↵ ${"c".repeat(153)}…\` |`);
  });
});
