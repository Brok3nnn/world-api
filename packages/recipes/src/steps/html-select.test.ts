import { err, ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import type { JsonValue } from "../engine/json-value";
import type { StepContext, StepOf } from "../engine/step-executor";
import { createFakeEndpointReader } from "../ports/testing/fake-endpoint-reader";
import { createFakeSourceFetch } from "../ports/testing/fake-source-fetch";
import { htmlSelect } from "./html-select";

const PAGE = `<table id="levels">
  <tr><th>Gauge</th><th>Level</th></tr>
  <tr><td><a href="/g/1?x=1&amp;y=2">Upper</a></td><td class="cm"> 182&nbsp;cm
  </td></tr>
  <tr><td><a>Lower</a></td><td class="cm">201 cm</td></tr>
</table>
<script>document.write("<td class='cm'>0 cm</td>")</script>`;

function withPage(page: JsonValue): StepContext {
  return {
    results: new Map([["page", page]]),
    deps: {
      fetch: createFakeSourceFetch({}),
      readEndpoint: createFakeEndpointReader({}),
      clock: createFakeClock(new Date("2026-11-22T10:00:00Z")),
    },
  };
}

function step(fields: Partial<StepOf<"html.select">>): StepOf<"html.select"> {
  return { id: "picked", use: "html.select", from: "page", selector: "td.cm", ...fields };
}

describe("htmlSelect", () => {
  it("reads the text of the first match as a person reads it", async () => {
    expect(await htmlSelect(step({}), withPage(PAGE))).toEqual(ok({ value: "182 cm" }));
  });

  it("reads the text of every match with all, and never the inside of a script", async () => {
    expect(await htmlSelect(step({ all: true }), withPage(PAGE))).toEqual(
      ok({ value: ["182 cm", "201 cm"] }),
    );
  });

  it("reads an attribute, decoded, of the first match", async () => {
    const link = step({ selector: "#levels a", attr: "href" });
    expect(await htmlSelect(link, withPage(PAGE))).toEqual(ok({ value: "/g/1?x=1&y=2" }));
  });

  it("finds elements inside preformatted text, as a browser does", async () => {
    const listing = '<pre><a href="a.csv">a.csv</a>  12:00\n<a href="b.csv">b.csv</a>  13:00</pre>';
    const links = step({ selector: "pre a", attr: "href", all: true });

    expect(await htmlSelect(links, withPage(listing))).toEqual(ok({ value: ["a.csv", "b.csv"] }));
  });

  it("passes over matches without the attribute", async () => {
    const links = step({ selector: "a", attr: "href", all: true });
    expect(await htmlSelect(links, withPage(PAGE))).toEqual(ok({ value: ["/g/1?x=1&y=2"] }));
  });

  it.each([
    ["no element matches", step({ selector: "td.missing" })],
    ["no match has the attribute", step({ selector: "td", attr: "title", all: true })],
    ["the selector cannot be read", step({ selector: "td[" })],
  ])("fails with selector_empty when %s", async (_case, picking) => {
    expect(await htmlSelect(picking, withPage(PAGE))).toEqual(err({ code: "selector_empty" }));
  });

  it.each([
    { rows: [] },
    42,
    null,
  ])("fails with unexpected_content when the result read is %j, not HTML text", async (page) => {
    expect(await htmlSelect(step({}), withPage(page))).toEqual(err({ code: "unexpected_content" }));
  });
});
