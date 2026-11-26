import type { Endpoint } from "@/features/catalog/types";
import { TrendingEndpointRow } from "./trending-endpoint-row";

interface TrendingEndpointsProps {
  /** Already sorted by growth. */
  endpoints: readonly Endpoint[];
}

export function TrendingEndpoints({ endpoints }: TrendingEndpointsProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">Fastest growing in the last 30 days.</p>
      <ol className="flex flex-col gap-2">
        {endpoints.map((endpoint, index) => (
          <TrendingEndpointRow key={endpoint.id} endpoint={endpoint} rank={index + 1} />
        ))}
      </ol>
    </div>
  );
}
