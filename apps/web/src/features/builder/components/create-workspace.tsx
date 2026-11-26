"use client";

import { UploadIcon, WandSparklesIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BUILDER_MODES } from "../constants";
import { builderSearchParams } from "../search-params";
import type { BuildRequest } from "../types";
import { PublishWizard } from "./publish-wizard";
import { RequestBuilder } from "./request-builder";

interface CreateWorkspaceProps {
  publisherHandle: string;
}

/** The two ways to create an API, switched by a segmented control. Mode and request live in the URL. */
export function CreateWorkspace({ publisherHandle }: CreateWorkspaceProps) {
  const [{ mode, q, sources, shape, refresh }, setParams] = useQueryStates(builderSearchParams);
  const request: BuildRequest = { q, sources, shape, refresh };

  return (
    <Tabs
      value={mode}
      onValueChange={(next) => {
        const nextMode = BUILDER_MODES.find((candidate) => candidate === next);
        if (nextMode) {
          void setParams({ mode: nextMode });
        }
      }}
      className="gap-6"
    >
      <TabsList
        aria-label="What do you want to do?"
        className="w-full rounded-xl p-1 group-data-horizontal/tabs:h-11 sm:w-fit"
      >
        <TabsTrigger value="request" className="rounded-lg px-3">
          <WandSparklesIcon aria-hidden />
          Request an API
        </TabsTrigger>
        <TabsTrigger value="publish" className="rounded-lg px-3">
          <UploadIcon aria-hidden />
          Share your data
        </TabsTrigger>
      </TabsList>

      {/* Both panels stay mounted so switching modes keeps a half-filled form. */}
      <TabsContent value="request" keepMounted>
        <RequestBuilder
          request={request}
          onRequestChange={(next) => void setParams(next)}
          publisherHandle={publisherHandle}
        />
      </TabsContent>
      <TabsContent value="publish" keepMounted>
        <PublishWizard publisherHandle={publisherHandle} />
      </TabsContent>
    </Tabs>
  );
}
