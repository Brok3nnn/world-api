import { EndpointCard } from "@/features/catalog/components/endpoint-card";
import type { Endpoint } from "@/features/catalog/types";

interface NewestEndpointsProps {
  /** Already sorted newest first. */
  endpoints: readonly Endpoint[];
}

export function NewestEndpoints({ endpoints }: NewestEndpointsProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">Freshly published endpoints, newest first.</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {endpoints.map((endpoint) => (
          <li key={endpoint.id} className="flex">
            <EndpointCard endpoint={endpoint} className="flex-1" />
          </li>
        ))}
      </ul>
    </div>
  );
}
