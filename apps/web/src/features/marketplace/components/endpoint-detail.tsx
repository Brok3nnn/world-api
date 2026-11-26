import { notFound } from "next/navigation";
import { getEndpoint, getPublisher, listEndpoints } from "@/features/catalog/data/queries";
import { selectRelatedEndpoints } from "../lib/select-related-endpoints";
import { DeveloperDetails } from "./developer-details";
import { EndpointBreadcrumb } from "./endpoint-breadcrumb";
import { EndpointHero } from "./endpoint-hero";
import { EndpointSourcesCard } from "./endpoint-sources-card";
import { EndpointStatTiles } from "./endpoint-stat-tiles";
import { RelatedEndpoints } from "./related-endpoints";
import { UseEndpointPanel } from "./use-endpoint-panel";

interface EndpointDetailProps {
  params: Promise<{ publisher: string; slug: string }>;
}

const RELATED_LIMIT = 4;

/**
 * Everything on the endpoint page that depends on the URL. Rendered inside `<Suspense>` by the
 * route so navigations can show the skeleton instantly while this resolves.
 */
export async function EndpointDetail({ params }: EndpointDetailProps) {
  const { publisher: publisherHandle, slug } = await params;
  const endpoint = await getEndpoint(publisherHandle, slug);
  if (!endpoint) {
    notFound();
  }

  const [publisher, endpoints] = await Promise.all([
    getPublisher(publisherHandle),
    listEndpoints(),
  ]);
  const related = selectRelatedEndpoints(endpoint, endpoints, RELATED_LIMIT);

  return (
    <>
      <EndpointBreadcrumb endpoint={endpoint} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <EndpointHero endpoint={endpoint} publisher={publisher} />
          <p className="max-w-prose text-pretty text-ink-800 text-lg">{endpoint.summary}</p>
          <EndpointStatTiles endpoint={endpoint} />
          <DeveloperDetails endpoint={endpoint} />
        </div>

        <aside
          aria-label="Use and sources"
          className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
        >
          <UseEndpointPanel endpoint={endpoint} />
          <EndpointSourcesCard endpoint={endpoint} />
        </aside>
      </div>

      {related.length > 0 ? (
        <RelatedEndpoints category={endpoint.category} endpoints={related} />
      ) : null}
    </>
  );
}
