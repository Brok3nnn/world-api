import type { Metadata } from "next";
import { Suspense } from "react";
import { Eyebrow } from "@/components/shared/eyebrow";
import { PageHeader } from "@/components/shared/page-header";
import { CATEGORY_IDS } from "@/features/catalog/constants";
import { listEndpoints } from "@/features/catalog/data/queries";
import { countByCategory } from "@/features/catalog/lib/filter-endpoints";
import { MarketplaceBrowser } from "@/features/marketplace/components/marketplace-browser";
import { MarketplaceBrowserFallback } from "@/features/marketplace/components/marketplace-browser-fallback";
import { PublishBanner } from "@/features/marketplace/components/publish-banner";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Explore",
  description: "Live data APIs, ready to use in your app or AI.",
};

export default async function MarketplacePage() {
  const endpoints = await listEndpoints();
  const counts = countByCategory(endpoints);
  const categories = CATEGORY_IDS.filter((category) => counts.has(category));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow={<Eyebrow live>{formatNumber(endpoints.length)} live APIs</Eyebrow>}
        title="Explore"
        description="Live data, ready for your app or AI."
      />
      <Suspense
        fallback={<MarketplaceBrowserFallback endpoints={endpoints} categories={categories} />}
      >
        <MarketplaceBrowser endpoints={endpoints} categories={categories} />
      </Suspense>
      <PublishBanner />
    </div>
  );
}
