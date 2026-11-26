import { afterEach, describe, expect, it } from "vitest";
import { servedEndpoint } from "../../testing/test-deps";
import type { CatalogSearch } from "../catalog-search";
import type { ServedEndpoint } from "../endpoint-directory";

/** A search over the given endpoints, and how to release it. */
export interface SearchUnderTest {
  readonly search: CatalogSearch;
  readonly close: () => Promise<void>;
}

/** Three weather endpoints that answer, one private, one disabled, and one about rates. */
export const SEARCHED: readonly ServedEndpoint[] = [
  servedEndpoint({ slug: "weather-vienna", summary: "Air temperature in Vienna." }),
  servedEndpoint({ slug: "weather-graz", summary: "Air temperature in Graz.", status: "degraded" }),
  servedEndpoint({ slug: "weather-linz", summary: "Air temperature in Linz." }),
  servedEndpoint({ slug: "weather-hidden", summary: "Hidden weather.", visibility: "private" }),
  servedEndpoint({ slug: "weather-off", summary: "Weather that is off.", status: "disabled" }),
  servedEndpoint({
    slug: "treasury-rates",
    title: "Treasury rates",
    summary: "Average interest rates.",
    category: "finance",
  }),
];

/** What every `CatalogSearch` adapter must do; each adapter's test runs these. */
export function describeCatalogSearch(
  name: string,
  setup: (endpoints: readonly ServedEndpoint[]) => Promise<SearchUnderTest>,
): void {
  describe(`${name} as a CatalogSearch`, () => {
    let underTest: SearchUnderTest | undefined;

    async function search(): Promise<CatalogSearch> {
      underTest = await setup(SEARCHED);
      return underTest.search;
    }

    afterEach(async () => {
      await underTest?.close();
    });

    it("finds endpoints that answer by words of the title and summary, never private or disabled ones", async () => {
      const found = await (await search()).search({ words: "weather now", limit: 10 });

      expect(found.ok && found.value.items.map((item) => item.slug).sort()).toEqual([
        "weather-graz",
        "weather-linz",
        "weather-vienna",
      ]);
      expect(found.ok && found.value.nextCursor).toBeNull();
    });

    it("pages through the matches with the cursor it issues", async () => {
      const catalog = await search();

      const first = await catalog.search({ words: "temperature", limit: 2 });
      const cursor = first.ok ? (first.value.nextCursor ?? "") : "";
      const second = await catalog.search({ words: "temperature", limit: 2, cursor });

      expect(first.ok && first.value.items).toHaveLength(2);
      expect(second.ok && [second.value.items.length, second.value.nextCursor]).toEqual([1, null]);
    });

    it("refuses a cursor it did not issue", async () => {
      expect(
        await (await search()).search({ words: "weather", limit: 2, cursor: "garbage" }),
      ).toEqual({
        ok: false,
        error: { code: "invalid_cursor" },
      });
    });
  });
}
