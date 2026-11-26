import { describeCatalogSearch } from "../../ports/testing/catalog-search-contract";
import { createMemoryCatalogSearch } from "./memory-catalog-search";

describeCatalogSearch("The memory search", async (endpoints) => ({
  search: createMemoryCatalogSearch(endpoints),
  close: async () => undefined,
}));
