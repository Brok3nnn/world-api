import { afterEach, describe, expect, it } from "vitest";
import { servedEndpoint } from "../../testing/test-deps";
import type { EndpointDirectory, ServedEndpoint } from "../endpoint-directory";

/** An adapter holding the given endpoints, and how to release it. */
export interface DirectoryUnderTest {
  readonly directory: EndpointDirectory;
  readonly close: () => Promise<void>;
}

/** What every `EndpointDirectory` adapter must do; each adapter's test runs these. */
export function describeEndpointDirectory(
  name: string,
  setup: (endpoints: readonly ServedEndpoint[]) => Promise<DirectoryUnderTest>,
): void {
  describe(`${name} as an EndpointDirectory`, () => {
    let underTest: DirectoryUnderTest | undefined;
    const VIENNA = servedEndpoint();
    const WITHOUT_RECIPE = {
      ...servedEndpoint({ slug: "no-recipe-yet", status: "building" }),
      recipe: null,
      sources: [],
    };

    async function directoryWith(endpoints: readonly ServedEndpoint[]): Promise<EndpointDirectory> {
      underTest = await setup(endpoints);
      return underTest.directory;
    }

    afterEach(async () => {
      await underTest?.close();
    });

    it("finds an endpoint by owner and slug, with its definition, recipe and sources", async () => {
      const directory = await directoryWith([VIENNA]);

      expect(await directory.find({ owner: "core", slug: "weather-now-vienna" })).toEqual(VIENNA);
    });

    it("finds an endpoint that has no recipe and no sources yet", async () => {
      const directory = await directoryWith([VIENNA, WITHOUT_RECIPE]);

      expect(await directory.find({ owner: "core", slug: "no-recipe-yet" })).toEqual(
        WITHOUT_RECIPE,
      );
    });

    it("answers null for an unknown slug, and for a known slug under another owner", async () => {
      const directory = await directoryWith([VIENNA]);

      expect(await directory.find({ owner: "core", slug: "unknown" })).toBeNull();
      expect(await directory.find({ owner: "someone", slug: "weather-now-vienna" })).toBeNull();
    });
  });
}
