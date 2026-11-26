import { describe, expect, it } from "vitest";
import { createRecordingLogger } from "./recording-logger";

describe("createRecordingLogger", () => {
  it("starts with no entries", () => {
    expect(createRecordingLogger().entries).toEqual([]);
  });

  it("keeps the level, event and fields of a log line", () => {
    const logger = createRecordingLogger();

    logger.log("info", "call.completed", { latency_ms: 12, refreshed: false });

    expect(logger.entries).toEqual([
      { level: "info", event: "call.completed", fields: { latency_ms: 12, refreshed: false } },
    ]);
  });

  it("records empty fields when none are given", () => {
    const logger = createRecordingLogger();

    logger.log("error", "refresh.failed");

    expect(logger.entries).toEqual([{ level: "error", event: "refresh.failed", fields: {} }]);
  });

  it("keeps entries in the order they were logged", () => {
    const logger = createRecordingLogger();

    logger.log("debug", "first");
    logger.log("warn", "second");

    expect(logger.entries.map((entry) => entry.event)).toEqual(["first", "second"]);
  });
});
