import { describe, expect, it } from "vitest";
import { readGatewayEnvironment } from "./env";

describe("readGatewayEnvironment", () => {
  it("reads the contact and defaults the log level to info", () => {
    expect(readGatewayEnvironment({ USER_AGENT_CONTACT: "https://example.com/contact" })).toEqual({
      LOG_LEVEL: "info",
      USER_AGENT_CONTACT: "https://example.com/contact",
    });
  });

  it("stops at start-up without a contact or with an unknown level, naming both", () => {
    expect(() => readGatewayEnvironment({ LOG_LEVEL: "loud" })).toThrow(
      "Invalid configuration. Check these variables: LOG_LEVEL, USER_AGENT_CONTACT.",
    );
  });
});
