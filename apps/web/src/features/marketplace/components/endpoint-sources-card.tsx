import { cn } from "cn";
import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { COMPLIANCE_LABELS, RESPONSE_METHODS } from "@/features/catalog/constants";
import type { Endpoint } from "@/features/catalog/types";

interface EndpointSourcesCardProps {
  endpoint: Endpoint;
}

/** Where the data comes from, each source's legal status, and how the value is produced. */
export function EndpointSourcesCard({ endpoint }: EndpointSourcesCardProps) {
  return (
    <section aria-labelledby="endpoint-sources-title" className="rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="endpoint-sources-title" className="font-semibold text-ink-950">
          Sources
        </h2>
        <span className="text-muted-foreground text-xs">{RESPONSE_METHODS[endpoint.method]}</span>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {endpoint.sources.map((source) => {
          const cleared = source.compliance === "green";
          const Icon = cleared ? ShieldCheckIcon : ShieldAlertIcon;
          return (
            <li key={source.name} className="flex items-center gap-3">
              <Icon
                aria-label={COMPLIANCE_LABELS[source.compliance]}
                className={cn("size-5 shrink-0", cleared ? "text-mint-600" : "text-amber-600")}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-ink-950 text-sm">{source.name}</span>
                <span className="text-muted-foreground text-xs">{source.license}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {endpoint.sourceKind === "camera" ? (
        <p className="mt-4 rounded-lg bg-ink-50 p-3 text-muted-foreground text-xs">
          Frames are deleted after analysis. Only counts leave the camera.
        </p>
      ) : null}
    </section>
  );
}
