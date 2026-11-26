import { ChevronDownIcon, CodeXmlIcon } from "lucide-react";
import type { Endpoint } from "@/features/catalog/types";
import { EndpointParameterList } from "./endpoint-parameter-list";
import { EndpointShapeTabs } from "./endpoint-shape-tabs";

interface DeveloperDetailsProps {
  endpoint: Endpoint;
}

/** Response formats and query parameters, collapsed by default to keep the page simple. */
export function DeveloperDetails({ endpoint }: DeveloperDetailsProps) {
  return (
    <details className="group rounded-2xl border">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <CodeXmlIcon aria-hidden className="size-5 text-cobalt-600" />
        <span className="flex-1 font-semibold text-ink-950">For developers</span>
        <span className="text-muted-foreground text-sm">Formats and parameters</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-8 border-t p-5">
        <EndpointShapeTabs endpoint={endpoint} />
        <EndpointParameterList endpoint={endpoint} />
      </div>
    </details>
  );
}
