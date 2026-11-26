import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site";
import { getViewer } from "@/features/account/data/queries";
import { getPublisher, listEndpoints } from "@/features/catalog/data/queries";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import { sortEndpoints } from "@/features/catalog/lib/filter-endpoints";
import { EndpointGrid } from "@/features/marketplace/components/endpoint-grid";
import { LikedEndpoints } from "./liked-endpoints";
import { ProfileIdentity } from "./profile-identity";
import { ProfileStats } from "./profile-stats";

interface PublisherProfileProps {
  params: Promise<{ handle: string }>;
}

/**
 * Everything on a profile page that depends on the URL. Rendered inside `<Suspense>` by the
 * route so navigations can show the skeleton instantly while this resolves.
 */
export async function PublisherProfile({ params }: PublisherProfileProps) {
  const { handle } = await params;
  const publisher = await getPublisher(handle);
  if (!publisher) {
    notFound();
  }

  const [viewer, endpoints] = await Promise.all([getViewer(), listEndpoints()]);
  const own = viewer.handle === publisher.handle;
  const published = sortEndpoints(
    endpoints.filter((endpoint) => endpoint.publisherHandle === publisher.handle),
    "popular",
  );

  return (
    <>
      <div aria-hidden className="noise h-28 rounded-3xl bg-hero md:h-36" />
      <ProfileIdentity
        publisher={publisher}
        shareUrl={new URL(publisherHref(publisher.handle), siteConfig.appBaseUrl).toString()}
        own={own}
      />
      <div className="px-1 sm:px-4">
        <ProfileStats endpoints={published} />
      </div>

      <Tabs defaultValue="apis" className="gap-5">
        <TabsList>
          <TabsTrigger value="apis" className="px-3">
            APIs
          </TabsTrigger>
          {own ? (
            <TabsTrigger value="liked" className="px-3">
              Liked
            </TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="apis">
          <EndpointGrid endpoints={published} eagerCount={4} />
        </TabsContent>
        {own ? (
          <TabsContent value="liked">
            <LikedEndpoints endpoints={endpoints} />
          </TabsContent>
        ) : null}
      </Tabs>
    </>
  );
}
