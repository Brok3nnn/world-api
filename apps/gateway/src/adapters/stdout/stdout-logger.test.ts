import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { createStdoutLogger } from "./stdout-logger";

function logger(level: "debug" | "info" | "warn" | "error") {
  const lines: string[] = [];
  const log = createStdoutLogger({
    app: "gateway",
    level,
    clock: createFakeClock(new Date("2026-11-22T10:00:00Z")),
    write: (line) => lines.push(line),
  });
  return { log, lines };
}

describe("createStdoutLogger", () => {
  it("writes one JSON object per line with the time, level, app, event and fields", () => {
    const { log, lines } = logger("info");

    log.log("info", "gateway.started", { port: 8787 });

    expect(lines).toEqual([
      '{"time":"2026-11-22T10:00:00.000Z","level":"info","app":"gateway","event":"gateway.started","port":8787}\n',
    ]);
  });

  it("drops events below its level and keeps the rest", () => {
    const { log, lines } = logger("warn");

    log.log("debug", "a");
    log.log("info", "b");
    log.log("warn", "c");
    log.log("error", "d");

    expect(lines.map((line) => JSON.parse(line).event)).toEqual(["c", "d"]);
  });
});
