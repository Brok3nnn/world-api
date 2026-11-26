import type { Metadata } from "next";
import { Suspense } from "react";
import { Eyebrow } from "@/components/shared/eyebrow";
import { listEndpoints, listPublishers } from "@/features/catalog/data/queries";
import { SearchExperience } from "@/features/search/components/search-experience";
import { SearchInput } from "@/features/search/components/search-input";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Search",
  description: "Find endpoints, publishers and categories, or build the data API that is missing.",
};

export default async function SearchPage() {
  const [endpoints, publishers] = await Promise.all([listEndpoints(), listPublishers()]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <Eyebrow live>{formatNumber(endpoints.length)} live APIs</Eyebrow>
        <h1 className="font-heading text-4xl text-ink-950 md:text-5xl">Search</h1>
        <p className="max-w-xl text-pretty text-muted-foreground md:text-lg">
          Find it, or build it if it is missing.
        </p>
      </header>
      <Suspense fallback={<SearchInput value="" />}>
        <SearchExperience endpoints={endpoints} publishers={publishers} />
      </Suspense>
    </div>
  );
}
