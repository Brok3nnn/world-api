import type { SearchPage } from "../search-page";

/** A first page of `GET /search?q=weather` with one more page to come. */
export const SEARCH_PAGE_EXAMPLE = {
  items: [
    {
      owner: "core",
      slug: "topeka-weather",
      title: "Weather in Topeka",
      summary:
        "Latest observation at Topeka airport, Kansas: temperature, conditions, wind and humidity.",
      url: "https://api.example.com/@core/topeka-weather",
      price_credits: 1,
    },
  ],
  next_cursor: "b2Zmc2V0OjIw",
} as const satisfies SearchPage;
