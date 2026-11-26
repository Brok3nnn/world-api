import { errorBodySchema } from "@repo/contracts/api/error";
import { createRecordingLogger } from "@repo/core/log/testing/recording-logger";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { storedValue, testDeps, valuesWith } from "../testing/test-deps";
import { ANONYMOUS_CALLS } from "./limit-rate";

function gateway() {
  const logger = createRecordingLogger();
  const app = createApp(testDeps({ logger, values: valuesWith(storedValue(60)) }));
  const call = (address: string) =>
    app(new Request("https://api.example.com/@core/weather-now-vienna"), { address });
  return { call, logger };
}

describe("limitRate", () => {
  it("answers the call past an address's burst with 429 and retry-after", async () => {
    const { call } = gateway();
    for (let index = 0; index < ANONYMOUS_CALLS.burst; index += 1) {
      expect((await call("203.0.113.7")).status).toBe(200);
    }

    const limited = await call("203.0.113.7");

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("1");
    expect(errorBodySchema.parse(await limited.json()).error.code).toBe("rate_limited");
  });

  it("limits each address on its own, and never writes an address down", async () => {
    const { call, logger } = gateway();
    for (let index = 0; index <= ANONYMOUS_CALLS.burst; index += 1) {
      await call("203.0.113.7");
    }

    expect((await call("203.0.113.8")).status).toBe(200);
    expect(JSON.stringify(logger.entries)).not.toContain("203.0.113");
  });
});
