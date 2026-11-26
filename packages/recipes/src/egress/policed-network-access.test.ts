import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = new URL("..", import.meta.url).pathname;

/** Every source file of the package that is not a test or a test double. */
function sources(): { file: string; text: string }[] {
  return readdirSync(SOURCE, { recursive: true, encoding: "utf8" })
    .filter(
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.includes("testing/"),
    )
    .map((file) => ({ file, text: readFileSync(join(SOURCE, file), "utf8") }));
}

describe("network access in the package", () => {
  it("has source files to look at", () => {
    expect(sources().length).toBeGreaterThan(10);
  });

  it("never calls the platform's fetch directly", () => {
    const direct = /(^|[^.\w])fetch\(|globalThis\.fetch/;
    expect(
      sources()
        .filter(({ text }) => direct.test(text))
        .map(({ file }) => file),
    ).toEqual([]);
  });

  it("calls the HTTP client only from the policed fetch", () => {
    expect(
      sources()
        .filter(({ text }) => /\.http\(/.test(text))
        .map(({ file }) => file),
    ).toEqual(["egress/create-policed-fetch.ts"]);
  });
});
