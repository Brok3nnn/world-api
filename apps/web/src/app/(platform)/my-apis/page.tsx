import { HammerIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/shared/eyebrow";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/features/account/components/auth-gate";
import { getViewer } from "@/features/account/data/queries";
import { builderUrl } from "@/features/builder/search-params";
import { BuildsInProgress } from "@/features/dashboard/components/builds-in-progress";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { OwnedEndpointsTable } from "@/features/dashboard/components/owned-endpoints-table";
import { getDashboardOverview } from "@/features/dashboard/data/queries";

export const metadata: Metadata = {
  title: "My APIs",
  description: "Your endpoints, usage and builds.",
};

export default async function MyApisPage() {
  const [viewer, overview] = await Promise.all([getViewer(), getDashboardOverview()]);

  return (
    <AuthGate subject="your APIs">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <PageHeader
          eyebrow={<Eyebrow>@{viewer.handle}</Eyebrow>}
          title="My APIs"
          description="What you built and how it is used."
          actions={
            <>
              <Button variant="brand" nativeButton={false} render={<Link href={builderUrl()} />}>
                <HammerIcon aria-hidden data-icon="inline-start" />
                Request an API
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={builderUrl({ mode: "publish" })} />}
              >
                <UploadIcon aria-hidden data-icon="inline-start" />
                Publish data
              </Button>
            </>
          }
        />

        <DashboardStats viewer={viewer} summary={overview.summary} />

        <OwnedEndpointsTable endpoints={overview.endpoints} publisherHandle={viewer.handle} />

        <BuildsInProgress builds={overview.builds} />
      </div>
    </AuthGate>
  );
}
