"use client";

import { throttle, useQueryState } from "nuqs";
import type { Endpoint, Publisher } from "@/features/catalog/types";
import { searchSearchParams } from "../search-params";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";
import { SearchSuggestions } from "./search-suggestions";

interface SearchExperienceProps {
  endpoints: readonly Endpoint[];
  publishers: readonly Publisher[];
}

const URL_UPDATE_THROTTLE_MS = 300;

/** Search field bound to the `q` URL parameter, with suggestions or grouped results below. */
export function SearchExperience({ endpoints, publishers }: SearchExperienceProps) {
  const [query, setQuery] = useQueryState(
    "q",
    searchSearchParams.q.withOptions({ limitUrlUpdates: throttle(URL_UPDATE_THROTTLE_MS) }),
  );
  const trimmedQuery = query.trim();

  const updateQuery = (value: string) => {
    void setQuery(value);
  };

  return (
    <div className="flex flex-col gap-12">
      <SearchInput value={query} onValueChange={updateQuery} />
      {trimmedQuery ? (
        <SearchResults
          query={trimmedQuery}
          endpoints={endpoints}
          publishers={publishers}
          onQueryChange={updateQuery}
        />
      ) : (
        <SearchSuggestions endpoints={endpoints} onQueryChange={updateQuery} />
      )}
    </div>
  );
}
