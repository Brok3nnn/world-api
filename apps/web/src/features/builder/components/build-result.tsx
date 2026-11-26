import { ChevronDownIcon, CodeXmlIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/shared/code-block";
import { CopyButton } from "@/components/shared/copy-button";
import { CopyField } from "@/components/shared/copy-field";
import { Button } from "@/components/ui/button";
import { EndpointCover } from "@/features/catalog/components/endpoint-cover";
import { EndpointStatus } from "@/features/catalog/components/endpoint-status";
import { EndpointValue } from "@/features/catalog/components/endpoint-value";
import { endpointApiUrl } from "@/features/catalog/lib/endpoint-urls";
import { buildIntegrationPrompt } from "@/features/catalog/lib/integration-prompt";
import { renderResponsePreview } from "@/features/catalog/lib/response-preview";
import type { Endpoint } from "@/features/catalog/types";
import { formatCredits } from "@/lib/format";
import { VISIBILITY_OPTIONS } from "../constants";
import type { BuildJob } from "../types";

interface BuildResultProps {
  endpoint: Endpoint;
  job: BuildJob;
}

/** The finished API in catalog-card style: first value, then one click to use it. */
export function BuildResult({ endpoint, job }: BuildResultProps) {
  const url = endpointApiUrl(endpoint);
  const visibility = VISIBILITY_OPTIONS[job.visibility];
  const VisibilityIcon = visibility.icon;

  return (
    <section
      aria-labelledby="build-result-title"
      className="flex flex-col gap-5 rounded-2xl border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <EndpointCover
          cover={endpoint.cover}
          sizes="48px"
          className="size-12 shrink-0 rounded-xl"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2
            id="build-result-title"
            className="line-clamp-2 font-semibold text-[0.9375rem] text-ink-950 leading-snug"
          >
            {endpoint.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
            <EndpointStatus status={endpoint.status} />
            <span className="inline-flex items-center gap-1">
              <VisibilityIcon aria-hidden className="size-3.5" />
              {visibility.label}
            </span>
            <span className="tabular-nums">{formatCredits(endpoint.priceCredits)} / call</span>
          </div>
        </div>
      </div>

      <EndpointValue preview={endpoint.preview} size="lg" />

      <div className="flex flex-col gap-2">
        <CopyButton
          value={buildIntegrationPrompt(endpoint)}
          label={`Copy AI prompt for ${endpoint.title}`}
          text="Copy AI prompt"
          variant="brand"
          className="h-10 w-full"
        />
        <div className="grid grid-cols-2 gap-2">
          <CopyButton
            value={url}
            label={`Copy link to ${endpoint.title}`}
            text="Copy link"
            variant="tint"
            className="h-9 w-full"
          />
          <Button variant="outline" nativeButton={false} render={<Link href="/my-apis" />}>
            <LayoutDashboardIcon aria-hidden data-icon="inline-start" />
            My APIs
          </Button>
        </div>
      </div>

      <details className="group rounded-xl border">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-3 font-medium text-ink-950 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <CodeXmlIcon aria-hidden className="size-4 text-brand" />
          <span className="flex-1">For developers</span>
          <ChevronDownIcon
            aria-hidden
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="flex flex-col gap-3 border-t p-3">
          <CopyField label="GET" value={url} copyLabel="Copy API link" />
          <CodeBlock
            title="Sample response"
            code={renderResponsePreview(
              endpoint,
              job.request.shape === "custom" ? "json" : job.request.shape,
            )}
            copyLabel="Copy sample response"
          />
        </div>
      </details>
    </section>
  );
}
