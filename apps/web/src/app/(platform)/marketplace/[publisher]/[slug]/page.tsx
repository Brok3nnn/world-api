import type { Metadata } from "next";
import { Suspense } from "react";
import { getEndpoint, listEndpoints } from "@/features/catalog/data/queries";
import { EndpointDetail } from "@/features/marketplace/components/endpoint-detail";
import { EndpointDetailSkeleton } from "@/features/marketplace/components/endpoint-detail-skeleton";

export async function generateStaticParams() {
  const endpoints = await listEndpoints();
  return endpoints.map((endpoint) => ({
    publisher: endpoint.publisherHandle,
    slug: endpoint.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/marketplace/[publisher]/[slug]">): Promise<Metadata> {
  const { publisher, slug } = await params;
  const endpoint = await getEndpoint(publisher, slug);
  return endpoint
    ? { title: endpoint.title, description: endpoint.summary }
    : { title: "Endpoint not found" };
}

export default function EndpointDetailPage({
  params,
}: PageProps<"/marketplace/[publisher]/[slug]">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<EndpointDetailSkeleton />}>
        <EndpointDetail params={params} />
      </Suspense>
    </div>
  );
}
