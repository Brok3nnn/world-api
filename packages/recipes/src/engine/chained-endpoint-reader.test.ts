import { err, ok } from "@repo/core/result";
import { describe, expect, it } from "vitest";
import { type ChainedRead, chainedEndpointReader } from "./chained-endpoint-reader";

/** A read that answers with the chain it was given, so tests can see how it grew. */
const echoChain: ChainedRead = async (_ref, chain) => ok({ chain: [...chain] });

describe("chainedEndpointReader", () => {
  it("reads for a top-level run and passes the chain on, ending with the endpoint read", async () => {
    const read = chainedEndpointReader(["@core/weather-mix"], echoChain);
    expect(await read("@core/rain-next-hour")).toEqual(
      ok({ chain: ["@core/weather-mix", "@core/rain-next-hour"] }),
    );
  });

  it("lets a mix read a mix: two levels of nesting", async () => {
    const read = chainedEndpointReader(["@core/outer", "@core/inner"], echoChain);
    expect(await read("@core/base")).toEqual(
      ok({ chain: ["@core/outer", "@core/inner", "@core/base"] }),
    );
  });

  it.each([
    ["an endpoint reads itself", ["@core/a"], "@core/a"],
    ["a read loops back to the start", ["@core/a", "@core/b"], "@core/a"],
    ["reads nest three levels deep", ["@core/a", "@core/b", "@core/c"], "@core/d"],
  ])("refuses when %s", async (_case, chain, ref) => {
    let reads = 0;
    const counting: ChainedRead = async (asked, grown) => {
      reads += 1;
      return echoChain(asked, grown);
    };
    expect(await chainedEndpointReader(chain, counting)(ref)).toEqual(
      err({ code: "limit_exceeded" }),
    );
    expect(reads).toBe(0);
  });
});
