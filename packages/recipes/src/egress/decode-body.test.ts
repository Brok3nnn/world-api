import { describe, expect, it } from "vitest";
import { decodeBody } from "./decode-body";

const UTF_8 = new TextEncoder().encode("Grüße: 21,5 °C");
/** "Müller; 3,4" in Latin-1: one byte per character, ü is 0xfc. */
const LATIN_1 = Uint8Array.from([0x4d, 0xfc, 0x6c, 0x6c, 0x65, 0x72, 0x3b, 0x20, 0x33, 0x2c, 0x34]);

describe("decodeBody", () => {
  it.each([
    null,
    "text/plain",
    "application/json; charset=utf-8",
    "text/csv; charset=windows-1250",
  ])("reads UTF-8 when the content type is %j", (contentType) => {
    expect(decodeBody(UTF_8, contentType)).toBe("Grüße: 21,5 °C");
  });

  it("drops a UTF-8 byte order mark", () => {
    const marked = Uint8Array.from([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("a;b")]);
    expect(decodeBody(marked, "text/csv")).toBe("a;b");
  });

  it.each([
    "text/csv; charset=ISO-8859-1",
    'text/csv;charset="iso-8859-1"',
    "text/plain; charset=latin1",
  ])("reads Latin-1 byte for byte when the content type is %j", (contentType) => {
    expect(decodeBody(LATIN_1, contentType)).toBe("Müller; 3,4");
  });

  it("decodes a Latin-1 body larger than one slice", () => {
    const long = new Uint8Array(20_000).fill(0xe9);
    expect(decodeBody(long, "text/plain; charset=iso-8859-1")).toBe("é".repeat(20_000));
  });
});
