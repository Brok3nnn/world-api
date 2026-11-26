"use client";

import { useState } from "react";
import { formatIsoSeconds } from "@/lib/format";
import { DEFAULT_MAX_PRICE_CREDITS, DEFAULT_SCHEMA_FIELDS } from "../constants";
import { useBuildSimulation } from "../hooks/use-build-simulation";
import { createDraftEndpoint } from "../lib/draft-endpoint";
import type { BuildRequest, SchemaField, Visibility } from "../types";
import { BuildCostSummary } from "./build-cost-summary";
import { BuildResult } from "./build-result";
import { BuildTimeline } from "./build-timeline";
import { RequestComposer } from "./request-composer";
import { RequestOptions } from "./request-options";

interface RequestBuilderProps {
  request: BuildRequest;
  onRequestChange: (request: BuildRequest) => void;
  /** Handle the finished API is published under. */
  publisherHandle: string;
}

/** "Request an API": composer and options on the left, build steps and cost on the right. */
export function RequestBuilder({ request, onRequestChange, publisherHandle }: RequestBuilderProps) {
  const build = useBuildSimulation();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [maxPriceCredits, setMaxPriceCredits] = useState(DEFAULT_MAX_PRICE_CREDITS);
  const [fields, setFields] = useState<SchemaField[]>([...DEFAULT_SCHEMA_FIELDS]);

  const changeRequest = (next: BuildRequest) => {
    // "My own fields" needs the field editor, which lives in the collapsed options.
    if (next.shape === "custom" && request.shape !== "custom") {
      setOptionsOpen(true);
    }
    onRequestChange(next);
  };

  const startBuild = (submitted: BuildRequest) =>
    build.start({
      request: submitted,
      visibility,
      maxPriceCredits,
      fields,
      startedAt: formatIsoSeconds(new Date()),
    });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-4">
        <RequestComposer value={request} onChange={changeRequest} onSubmit={startBuild} />
        {build.isComplete && build.job ? (
          <BuildResult endpoint={createDraftEndpoint(build.job, publisherHandle)} job={build.job} />
        ) : null}
        {build.isRunning ? null : (
          <RequestOptions
            open={optionsOpen}
            onOpenChange={setOptionsOpen}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            maxPriceCredits={maxPriceCredits}
            onMaxPriceChange={setMaxPriceCredits}
            showSchemaEditor={request.shape === "custom"}
            fields={fields}
            onFieldsChange={setFields}
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <BuildTimeline job={build.job} stepStatus={build.stepStatus} />
        <BuildCostSummary request={request} />
      </div>
    </div>
  );
}
