import { Eyebrow } from "@/components/shared/eyebrow";
import { CATEGORY_IDS } from "@/features/catalog/constants";
import { getCatalogStats, listEndpoints } from "@/features/catalog/data/queries";
import { countByCategory, sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import { HomeComposer } from "@/features/home/components/home-composer";
import { CategoryTabs } from "@/features/marketplace/components/category-tabs";
import { EndpointGrid } from "@/features/marketplace/components/endpoint-grid";
import { formatNumber } from "@/lib/format";

export default async function HomePage() {
  const [endpoints, stats] = await Promise.all([listEndpoints(), getCatalogStats()]);
  const counts = countByCategory(endpoints);
  const categories = CATEGORY_IDS.filter((category) => counts.has(category));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <section className="noise flex flex-col items-center gap-4 rounded-3xl bg-hero px-4 py-10 text-center text-white md:py-14">
        <Eyebrow live tone="inverse">
          {formatNumber(stats.endpointCount)} live APIs
        </Eyebrow>
        <h1 className="font-heading text-4xl md:text-5xl">Any live data, one link away.</h1>
        <p className="text-white/85">Describe it. Get a link your app or AI can use.</p>
        <HomeComposer className="mt-4 w-full max-w-2xl" />
      </section>

      <section aria-label="Catalog" className="flex flex-col gap-5">
        <CategoryTabs categories={categories} active={null} />
        <EndpointGrid endpoints={sortEndpoints(endpoints, "popular")} eagerCount={4} />
      </section>
    </div>
  );
}
