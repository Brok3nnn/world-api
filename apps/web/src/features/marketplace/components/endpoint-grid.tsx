import { cn } from "cn";
import { EndpointCard } from "@/features/catalog/components/endpoint-card";
import type { Endpoint } from "@/features/catalog/types";

interface EndpointGridProps {
  endpoints: readonly Endpoint[];
  /** How many leading cards load their photo eagerly (those above the fold). */
  eagerCount?: number;
  /** Pass four endpoints as a teaser: the fourth hides where three columns would orphan it. */
  teaser?: boolean;
}

export function EndpointGrid({ endpoints, eagerCount = 0, teaser = false }: EndpointGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {endpoints.map((endpoint, index) => (
        <li
          key={endpoint.id}
          className={cn("flex min-w-0", teaser && "md:max-xl:nth-[n+4]:hidden")}
        >
          <EndpointCard endpoint={endpoint} priority={index < eagerCount} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
