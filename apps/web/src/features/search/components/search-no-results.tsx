import { HammerIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { sampleCreditCosts } from "@/config/site";
import { builderUrl } from "@/features/builder/search-params";
import { formatNumber } from "@/lib/format";

interface SearchNoResultsProps {
  query: string;
}

const BUILD_STEPS = ["Source search", "Legal filter", "Recipe", "Sandbox tests"] as const;

/** Nothing matched: offer the builder agent, which is how the catalog grows. */
export function SearchNoResults({ query }: SearchNoResultsProps) {
  const [minCredits, maxCredits] = sampleCreditCosts.newEndpoint;

  return (
    <section
      aria-labelledby="search-no-results-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 rounded-3xl bg-ink-50 px-6 py-12 text-center"
    >
      <h2
        id="search-no-results-title"
        className="text-balance font-heading text-2xl text-ink-950 md:text-3xl"
      >
        Nothing for “{query}” yet
      </h2>
      <p className="max-w-md text-pretty text-muted-foreground">
        Describe it and we build it for you.
      </p>
      <Button
        variant="brand"
        size="lg"
        nativeButton={false}
        render={<Link href={builderUrl({ q: query })} />}
        className="max-w-full"
      >
        <HammerIcon aria-hidden data-icon="inline-start" />
        <span className="truncate">Build an API for “{query}”</span>
      </Button>
      <ol
        aria-label="How the builder agent works"
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-muted-foreground text-xs"
      >
        {BUILD_STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-1.5">
            <span className="text-violet-700">{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground text-xs">
        {formatNumber(minCredits)}–{formatNumber(maxCredits)} credits, once. You own the result.
      </p>
    </section>
  );
}
