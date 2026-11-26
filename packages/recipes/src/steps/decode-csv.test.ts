import { err, ok } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { decodeCsv } from "./decode-csv";

const REFUSED = err({ code: "unexpected_content" });

describe("decodeCsv", () => {
  it("reads a comma file into records keyed by the header", () => {
    expect(decodeCsv("city,temperature_c\nVienna,21.5\nGraz,19\n")).toEqual(
      ok([
        { city: "Vienna", temperature_c: "21.5" },
        { city: "Graz", temperature_c: "19" },
      ]),
    );
  });

  it("reads a semicolon file with padded columns and Windows line ends", () => {
    const station =
      "STATIONS_ID;MESS_DATUM;  QN_9;TT_TU;eor\r\n  433;2026112210;    3;   4.2;eor\r\n";
    expect(decodeCsv(station)).toEqual(
      ok([{ STATIONS_ID: "433", MESS_DATUM: "2026112210", QN_9: "3", TT_TU: "4.2", eor: "eor" }]),
    );
  });

  it("keeps a semicolon inside a comma file's cell, and a comma inside a semicolon file's", () => {
    expect(decodeCsv("a,b\nx;y,z")).toEqual(ok([{ a: "x;y", b: "z" }]));
    expect(decodeCsv("a;b\n3,4;5")).toEqual(ok([{ a: "3,4", b: "5" }]));
  });

  it("reads quoted cells exactly: delimiters, doubled quotes, line breaks and spaces", () => {
    const quoted = 'name,note\n"Doe, Jane","said ""hi""\nthen left"\n" padded ",x';
    expect(decodeCsv(quoted)).toEqual(
      ok([
        { name: "Doe, Jane", note: 'said "hi"\nthen left' },
        { name: " padded ", note: "x" },
      ]),
    );
  });

  it("reads empty cells, a missing last cell and a final delimiter as empty", () => {
    expect(decodeCsv("a,b,c\n1,,3\n4,5\n6,7,")).toEqual(
      ok([
        { a: "1", b: "", c: "3" },
        { a: "4", b: "5", c: "" },
        { a: "6", b: "7", c: "" },
      ]),
    );
  });

  it("skips blank lines and reads a header without rows as no records", () => {
    expect(decodeCsv("a,b\n\n1,2\n\n")).toEqual(ok([{ a: "1", b: "2" }]));
    expect(decodeCsv("a,b\n")).toEqual(ok([]));
  });

  it.each([
    ["no header at all", ""],
    ["only blank lines", "\n\n"],
    ["a row with more cells than the header", "a,b\n1,2,3"],
    ["a header that repeats a name", "a,a\n1,2"],
    ["a quote that never closes", 'a,b\n"1,2'],
    ["text after a closing quote", 'a,b\n"1"x,2'],
  ])("refuses %s", (_case, text) => {
    expect(decodeCsv(text)).toEqual(REFUSED);
  });
});
