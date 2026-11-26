import { describe, expect, it } from "vitest";
import { readCommandEnvironment } from "../commands/env";
import { createFakeHttpClient, type FakeHttpAnswer } from "../ports/testing/fake-http-client";
import { createFakeResolveHost } from "../ports/testing/fake-resolve-host";
import { createFakeWait } from "../ports/testing/fake-wait";
import { type RecorderContext, runRecorder } from "./run-recorder";
import { toRecording } from "./to-recording";

const URL_TO_RECORD = "https://api.example.org/v1/now";
const CONTACT = { USER_AGENT_CONTACT: "https://example.com/contact" };

/** A recorder with fake egress, a configuration source, and a record of what it wrote and said. */
function recorder(source: Record<string, string>, answers: Record<string, FakeHttpAnswer> = {}) {
  const client = createFakeHttpClient(answers);
  const written: [string, string][] = [];
  const reported: string[] = [];
  const context: RecorderContext = {
    environment: () => readCommandEnvironment(source),
    egress: {
      http: client.http,
      resolveHost: createFakeResolveHost({ "api.example.org": ["93.184.216.34"] }),
      wait: createFakeWait().wait,
    },
    write: async (file, text) => {
      written.push([file, text]);
    },
    report: (line) => reported.push(line),
  };
  return { context, client, written, reported };
}

describe("runRecorder", () => {
  it("records one response through the egress policy, with the contact in the user agent", async () => {
    const { context, client, written } = recorder(CONTACT, {
      [URL_TO_RECORD]: {
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: '{"t":21.5}',
      },
    });

    expect(await runRecorder([URL_TO_RECORD, "now.json"], context)).toBe(0);
    expect(client.requests[0]?.headers["user-agent"]).toBe(
      "recipe-engine/1 (+https://example.com/contact)",
    );
    expect(written).toEqual([
      [
        "now.json",
        `${JSON.stringify({ url: URL_TO_RECORD, status: 200, contentType: "application/json", body: '{"t":21.5}' }, null, 2)}\n`,
      ],
    ]);
  });

  it.each([
    ["without a contact", {}],
    [
      "with a contact that is neither an https page nor an email address",
      { USER_AGENT_CONTACT: "call me" },
    ],
  ])("refuses to run %s, and fetches and writes nothing", async (_case, source) => {
    const { context, client, written } = recorder(source);

    await expect(runRecorder([URL_TO_RECORD, "now.json"], context)).rejects.toThrow(
      "USER_AGENT_CONTACT",
    );
    expect(client.requests).toEqual([]);
    expect(written).toEqual([]);
  });

  it("accepts an email address as the contact", () => {
    expect(readCommandEnvironment({ USER_AGENT_CONTACT: "owner@example.com" })).toEqual({
      USER_AGENT_CONTACT: "owner@example.com",
    });
  });

  it.each([
    [[]],
    [[URL_TO_RECORD]],
    [["not a url", "x.json"]],
  ])("explains its usage when given %j", async (args) => {
    const { context, written, reported } = recorder(CONTACT);

    expect(await runRecorder(args, context)).toBe(2);
    expect(reported[0]).toMatch(/^Usage: /);
    expect(written).toEqual([]);
  });

  it("writes nothing when the policy refuses the URL", async () => {
    const { context, written, reported } = recorder(CONTACT);

    expect(await runRecorder(["http://api.example.org/v1/now", "now.json"], context)).toBe(1);
    expect(reported).toEqual(["Not recorded: policy_denied."]);
    expect(written).toEqual([]);
  });
});

describe("toRecording", () => {
  it("keeps the URL, status, media type and body, and nothing else", () => {
    const response = { status: 200, contentType: "text/csv", body: "a;b\n", bytes: 4 };

    expect(Object.keys(toRecording(URL_TO_RECORD, response)).sort()).toEqual([
      "body",
      "contentType",
      "status",
      "url",
    ]);
  });
});
