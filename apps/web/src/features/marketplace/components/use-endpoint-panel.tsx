import { LinkIcon, SparklesIcon, TerminalIcon } from "lucide-react";
import { CodeBlock } from "@/components/shared/code-block";
import { CopyButton } from "@/components/shared/copy-button";
import { CopyField } from "@/components/shared/copy-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildCurlCommand } from "@/features/catalog/lib/curl-command";
import { endpointApiUrl } from "@/features/catalog/lib/endpoint-urls";
import { buildIntegrationPrompt } from "@/features/catalog/lib/integration-prompt";
import type { Endpoint } from "@/features/catalog/types";
import { formatCredits } from "@/lib/format";

interface UseEndpointPanelProps {
  endpoint: Endpoint;
}

/** The action panel of an endpoint: price, and three ways to start using it. */
export function UseEndpointPanel({ endpoint }: UseEndpointPanelProps) {
  const url = endpointApiUrl(endpoint);
  const prompt = buildIntegrationPrompt(endpoint);

  return (
    <section
      aria-labelledby="use-endpoint-title"
      className="flex flex-col gap-4 rounded-2xl border p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="use-endpoint-title" className="font-semibold text-ink-950">
          Use this API
        </h2>
        <p className="text-sm tabular-nums">
          <span className="font-semibold text-ink-950">{formatCredits(endpoint.priceCredits)}</span>
          <span className="text-muted-foreground"> / call</span>
        </p>
      </div>

      <Tabs defaultValue="ai" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="ai">
            <SparklesIcon aria-hidden />
            AI tool
          </TabsTrigger>
          <TabsTrigger value="link">
            <LinkIcon aria-hidden />
            Link
          </TabsTrigger>
          <TabsTrigger value="code">
            <TerminalIcon aria-hidden />
            Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">Paste it into your AI coding tool.</p>
          <CopyButton
            value={prompt}
            label="Copy AI prompt"
            text="Copy AI prompt"
            variant="brand"
            className="h-10 w-full"
          />
        </TabsContent>

        <TabsContent value="link" className="flex flex-col gap-3">
          <CopyField label="GET" value={url} copyLabel="Copy API link" />
          <p className="text-muted-foreground text-xs">
            Add <code className="font-mono text-ink-800">?shape=number</code> to get just the
            number.
          </p>
        </TabsContent>

        <TabsContent value="code">
          <CodeBlock title="Terminal" code={buildCurlCommand(url)} copyLabel="Copy command" wrap />
        </TabsContent>
      </Tabs>

      <p className="border-t pt-3 text-muted-foreground text-xs">
        {formatCredits(endpoint.priceCredits)} per call · failed calls are free
      </p>
    </section>
  );
}
