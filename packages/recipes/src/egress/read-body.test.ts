import { err, ok } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { RUN_LIMITS } from "../engine/run-limits";
import { createFakeBodyReader } from "../ports/testing/fake-body-reader";
import { createFakeWait } from "../ports/testing/fake-wait";
import { startDeadline } from "./deadline";
import { readBody } from "./read-body";

const MEGABYTE = 1024 * 1024;

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

function deadline() {
  const timer = createFakeWait();
  return { timer, deadline: startDeadline(RUN_LIMITS.stepMs, timer.wait) };
}

describe("readBody", () => {
  it("joins the chunks of a body in order", async () => {
    const reader = createFakeBodyReader([bytes(1, 2), bytes(3), bytes(4, 5, 6)]);
    expect(await readBody(reader, deadline().deadline)).toEqual(ok(bytes(1, 2, 3, 4, 5, 6)));
  });

  it("reads an empty body", async () => {
    expect(await readBody(createFakeBodyReader([]), deadline().deadline)).toEqual(ok(bytes()));
  });

  it("accepts a body of exactly the size cap", async () => {
    const reader = createFakeBodyReader([new Uint8Array(RUN_LIMITS.responseBytes)]);
    const read = await readBody(reader, deadline().deadline);
    expect(read.ok && read.value.byteLength).toBe(RUN_LIMITS.responseBytes);
  });

  it("stops at the chunk that passes the size cap and asks for nothing more", async () => {
    const big = new Uint8Array(1.5 * MEGABYTE);
    const reader = createFakeBodyReader([big, big, big, big]);
    expect(await readBody(reader, deadline().deadline)).toEqual(err({ code: "too_large" }));
    expect(reader.reads()).toBe(2);
  });

  it("gives up on a body that stops arriving when the deadline passes", async () => {
    const { timer, deadline: budget } = deadline();
    const reading = readBody(createFakeBodyReader([bytes(1), "stalled"]), budget);
    timer.expire();
    expect(await reading).toEqual(err({ code: "fetch_timeout" }));
    expect(budget.signal.aborted).toBe(true);
  });

  it("reports a connection that broke in the middle of the body", async () => {
    const reader = createFakeBodyReader([bytes(1), "broken"]);
    expect(await readBody(reader, deadline().deadline)).toEqual(err({ code: "fetch_failed" }));
  });
});

describe("startDeadline", () => {
  it("asks for one timer of the given length and cancels it when the fetch is over", async () => {
    const { timer, deadline: budget } = deadline();
    expect(await budget.race(Promise.resolve("done"))).toEqual(ok("done"));
    budget.finish();
    expect(timer.started).toEqual([RUN_LIMITS.stepMs]);
    expect(timer.signals.map((signal) => signal.aborted)).toEqual([true]);
    expect(budget.signal.aborted).toBe(true);
  });

  it("does not time out a fetch whose timer was cancelled", async () => {
    const { timer, deadline: budget } = deadline();
    budget.finish();
    timer.expire();
    expect(await budget.race(Promise.resolve(7))).toEqual(ok(7));
  });
});
