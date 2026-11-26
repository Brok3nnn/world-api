import { CodeBlock } from "@/components/shared/code-block";
import { CopyField } from "@/components/shared/copy-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SHAPES } from "@/features/catalog/constants";
import { endpointApiUrl } from "@/features/catalog/lib/endpoint-urls";
import { renderResponsePreview } from "@/features/catalog/lib/response-preview";
import type { Endpoint, Shape } from "@/features/catalog/types";

interface EndpointShapeTabsProps {
  endpoint: Endpoint;
}

/** One tab per supported shape: the request URL for that shape and the response it returns. */
export function EndpointShapeTabs({ endpoint }: EndpointShapeTabsProps) {
  return (
    <Tabs defaultValue={endpoint.shapes[0]} className="gap-4">
      <TabsList className="h-9 w-full justify-start overflow-x-auto sm:w-fit">
        {endpoint.shapes.map((shape) => (
          <TabsTrigger key={shape} value={shape} className="flex-none px-3">
            {SHAPES[shape].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {endpoint.shapes.map((shape) => (
        <TabsContent key={shape} value={shape} className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">{SHAPES[shape].description}.</p>
          <CopyField
            label="GET"
            value={requestUrl(endpoint, shape)}
            copyLabel={`Copy ${SHAPES[shape].label} request URL`}
          />
          <CodeBlock
            title="Response"
            code={renderResponsePreview(endpoint, shape)}
            copyLabel={`Copy ${SHAPES[shape].label} response`}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function requestUrl(endpoint: Endpoint, shape: Shape): string {
  return endpointApiUrl(endpoint, {
    shape,
    ask: shape === "probability" ? endpoint.sample.probability?.question : undefined,
  });
}
