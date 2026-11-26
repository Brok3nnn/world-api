import { HammerIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { builderUrl } from "@/features/builder/search-params";

interface MarketplaceEmptyStateProps {
  query: string;
  onClearFilters: () => void;
}

/** Shown when filters match nothing: offers to build the missing endpoint instead. */
export function MarketplaceEmptyState({ query, onClearFilters }: MarketplaceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-lilac-50 text-violet-700 ring-1 ring-lilac-100">
        <SearchXIcon aria-hidden className="size-6" />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="font-heading text-2xl text-ink-950">
          {query ? `No endpoint matches “${query}”` : "No endpoint matches these filters"}
        </h2>
        <p className="text-muted-foreground text-sm">
          The builder agent can assemble it from permitted sources and keep it fresh. You become its
          owner.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {query ? (
          <Button
            variant="brand"
            nativeButton={false}
            render={<Link href={builderUrl({ q: query })} />}
          >
            <HammerIcon aria-hidden data-icon="inline-start" />
            Build “{query}” instead
          </Button>
        ) : null}
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
