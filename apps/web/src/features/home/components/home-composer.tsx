"use client";

import { cn } from "cn";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BracketFrame } from "@/components/shared/bracket-frame";
import { RequestComposer } from "@/features/builder/components/request-composer";
import { DEFAULT_BUILD_REQUEST, EXAMPLE_REQUESTS } from "@/features/builder/constants";
import { builderUrl } from "@/features/builder/search-params";
import type { BuildRequest } from "@/features/builder/types";

interface HomeComposerProps {
  className?: string;
}

/** Composer on the home hero. Submitting hands the request to the builder page. */
export function HomeComposer({ className }: HomeComposerProps) {
  const router = useRouter();
  const [request, setRequest] = useState<BuildRequest>(DEFAULT_BUILD_REQUEST);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <BracketFrame className="w-full">
        <RequestComposer
          value={request}
          onChange={setRequest}
          onSubmit={(submitted) => router.push(builderUrl(submitted))}
          className="shadow-float"
        />
      </BracketFrame>
      <ul aria-label="Example requests" className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_REQUESTS.map((example) => {
          const Icon = example.icon;
          return (
            <li key={example.label}>
              <button
                type="button"
                onClick={() => setRequest(example.request)}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white/12 pr-3.5 pl-3 font-medium text-sm text-white ring-1 ring-white/25 backdrop-blur-md transition-colors outline-none hover:bg-white/22 focus-visible:ring-3 focus-visible:ring-white/60"
              >
                <Icon aria-hidden className="size-4" />
                {example.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
