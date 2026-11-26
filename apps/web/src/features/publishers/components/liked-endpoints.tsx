"use client";

import { HeartIcon } from "lucide-react";
import { useLikedEndpointIds } from "@/features/catalog/hooks/use-endpoint-like";
import type { Endpoint } from "@/features/catalog/types";
import { EndpointGrid } from "@/features/marketplace/components/endpoint-grid";

interface LikedEndpointsProps {
  endpoints: readonly Endpoint[];
}

/** The APIs this visitor has liked, or a hint when there are none yet. */
export function LikedEndpoints({ endpoints }: LikedEndpointsProps) {
  const likedIds = useLikedEndpointIds();
  const liked = endpoints.filter((endpoint) => likedIds.has(endpoint.id));

  if (liked.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-ink-50 px-4 py-14 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-500">
          <HeartIcon aria-hidden className="size-5" />
        </span>
        <p className="font-semibold text-ink-950">No likes yet</p>
        <p className="text-muted-foreground text-sm">Tap the heart on any API to keep it here.</p>
      </div>
    );
  }

  return <EndpointGrid endpoints={liked} />;
}
