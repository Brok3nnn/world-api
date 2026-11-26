import { ChevronDownIcon, CodeXmlIcon } from "lucide-react";
import { CodeBlock } from "@/components/shared/code-block";
import { siteConfig } from "@/config/site";
import { sampleFromFields } from "../lib/sample-field-values";
import { slugify } from "../lib/slugify";
import type { PublishDraft } from "../types";

interface IngestCallDetailsProps {
  draft: Pick<PublishDraft, "name" | "fields">;
  publisherHandle: string;
}

/** How a device pushes values, collapsed for developers. */
export function IngestCallDetails({ draft, publisherHandle }: IngestCallDetailsProps) {
  return (
    <details className="group rounded-xl border">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-3 font-medium text-ink-950 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <CodeXmlIcon aria-hidden className="size-4 text-brand" />
        <span className="flex-1">For developers</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t p-3">
        <CodeBlock
          title="Push a value"
          code={ingestCommand(draft, publisherHandle)}
          copyLabel="Copy push command"
        />
      </div>
    </details>
  );
}

function ingestCommand(draft: IngestCallDetailsProps["draft"], publisherHandle: string): string {
  const url = `${siteConfig.apiBaseUrl}/ingest/@${publisherHandle}/${slugify(draft.name)}`;
  const body = JSON.stringify(sampleFromFields(draft.fields));
  return [
    `curl -X POST ${url} \\`,
    `  -H "Authorization: Bearer $INGEST_KEY" \\`,
    `  -d '${body}'`,
  ].join("\n");
}
