import { ok } from "@repo/core/result";
import { createFakeClock } from "@repo/core/time/testing/fake-clock";
import { describe, expect, it } from "vitest";
import { createFakeEndpointReader } from "../../ports/testing/fake-endpoint-reader";
import { httpGet } from "../../steps/http-get";
import type { Recording } from "../recording";
import EXAMPLE from "./example-recording.json" with { type: "json" };
import { createRecordedFetch } from "./recorded-fetch";

const JSON_RECORDING: Recording = {
  url: "https://api.example.org/v1/now",
  status: 200,
  contentType: "application/json",
  body: '{"t":21.5}',
};

describe("createRecordedFetch", () => {
  it("replays a recorded response byte for byte, counting bytes as UTF-8", async () => {
    const fetch = createRecordedFetch([EXAMPLE, JSON_RECORDING]);

    const replayed = await fetch({ url: EXAMPLE.url, headers: {} });

    expect(replayed).toEqual(
      ok({
        status: 200,
        contentType: "text/csv",
        body: "Station;Temperatur\nMünchen;4,2\nGöttingen;1,9\n",
        bytes: 47,
      }),
    );
  });

  it("feeds a step as a live source would", async () => {
    const deps = {
      fetch: createRecordedFetch([EXAMPLE]),
      readEndpoint: createFakeEndpointReader({}),
      clock: createFakeClock(new Date("2026-11-22T10:00:00Z")),
    };
    const step = { id: "stations", use: "http.get", url: EXAMPLE.url, expect: "csv" } as const;

    const read = await httpGet(step, { results: new Map(), deps });

    expect(read.ok && read.value.value).toEqual([
      { Station: "München", Temperatur: "4,2" },
      { Station: "Göttingen", Temperatur: "1,9" },
    ]);
  });

  it("fails a request that was not recorded, naming its URL", async () => {
    const fetch = createRecordedFetch([JSON_RECORDING]);

    await expect(fetch({ url: "https://api.example.org/v2/now", headers: {} })).rejects.toThrow(
      "https://api.example.org/v2/now",
    );
  });

  it("refuses the same URL recorded twice", () => {
    expect(() => createRecordedFetch([JSON_RECORDING, JSON_RECORDING])).toThrow(
      "https://api.example.org/v1/now is recorded twice.",
    );
  });
});
