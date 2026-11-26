import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { CATEGORIES } from "@/features/catalog/constants";
import type { CategoryId, Endpoint } from "@/features/catalog/types";
import { marketplaceUrl } from "../search-params";
import { EndpointGrid } from "./endpoint-grid";

interface RelatedEndpointsProps {
  category: CategoryId;
  endpoints: readonly Endpoint[];
}

export function RelatedEndpoints({ category, endpoints }: RelatedEndpointsProps) {
  const label = CATEGORIES[category].label;

  return (
    <section aria-labelledby="related-endpoints-title" className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 id="related-endpoints-title" className="font-semibold text-ink-950 text-lg">
          More like this
        </h2>
        <Link
          href={marketplaceUrl({ category })}
          className="inline-flex items-center gap-1 rounded-md font-medium text-cobalt-600 text-sm outline-none hover:text-cobalt-700 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Browse {label.toLowerCase()}
          <ArrowRightIcon aria-hidden className="size-3.5" />
        </Link>
      </div>
      <EndpointGrid endpoints={endpoints} teaser />
    </section>
  );
}
