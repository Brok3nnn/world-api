import type { Metadata } from "next";
import { Suspense } from "react";
import { getViewer } from "@/features/account/data/queries";
import { CreateWorkspace } from "@/features/builder/components/create-workspace";
import { CreateWorkspaceFallback } from "@/features/builder/components/create-workspace-fallback";

export const metadata: Metadata = {
  title: "Create an API",
  description: "Request data the catalog does not have yet, or share your own.",
};

export default async function CreatePage() {
  const viewer = await getViewer();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <h1 className="font-heading text-3xl text-ink-950 md:text-4xl">Create an API</h1>
      <Suspense fallback={<CreateWorkspaceFallback />}>
        <CreateWorkspace publisherHandle={viewer.handle} />
      </Suspense>
    </div>
  );
}
