import { HammerIcon, UploadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { builderUrl } from "@/features/builder/search-params";
import { listEndpoints, listPublishers } from "@/features/catalog/data/queries";
import { sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import { ActivityFeed } from "@/features/community/components/activity-feed";
import { ApiRequestBoard } from "@/features/community/components/api-request-board";
import { CommunityTabs } from "@/features/community/components/community-tabs";
import { CommunityTabsView } from "@/features/community/components/community-tabs-view";
import { NewestEndpoints } from "@/features/community/components/newest-endpoints";
import { PublisherLeaderboard } from "@/features/community/components/publisher-leaderboard";
import { TrendingEndpoints } from "@/features/community/components/trending-endpoints";
import { type CommunityTab, NEWEST_LIMIT, TRENDING_LIMIT } from "@/features/community/constants";
import { listApiRequests, listRecentActivity } from "@/features/community/data/queries";
import { rankPublishers } from "@/features/community/lib/rank-publishers";

export const metadata: Metadata = {
  title: "Community",
  description: "Trending endpoints, requested APIs and top publishers.",
};

export default async function CommunityPage() {
  const [endpoints, publishers, requests, activity] = await Promise.all([
    listEndpoints(),
    listPublishers(),
    listApiRequests(),
    listRecentActivity(),
  ]);

  const panels: Record<CommunityTab, ReactNode> = {
    trending: (
      <TrendingEndpoints
        endpoints={sortEndpoints(endpoints, "trending").slice(0, TRENDING_LIMIT)}
      />
    ),
    new: <NewestEndpoints endpoints={sortEndpoints(endpoints, "newest").slice(0, NEWEST_LIMIT)} />,
    requests: <ApiRequestBoard feed={requests} />,
    publishers: <PublisherLeaderboard rankings={rankPublishers(publishers, endpoints)} />,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Community"
        description="Built by the people who own the data."
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href={builderUrl()} />}>
              <HammerIcon aria-hidden data-icon="inline-start" />
              Request an API
            </Button>
            <Button
              variant="brand"
              nativeButton={false}
              render={<Link href={builderUrl({ mode: "publish" })} />}
            >
              <UploadIcon aria-hidden data-icon="inline-start" />
              Publish your data
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Suspense fallback={<CommunityTabsView value="trending" panels={panels} />}>
          <CommunityTabs panels={panels} />
        </Suspense>
        <ActivityFeed feed={activity} />
      </div>
    </div>
  );
}
