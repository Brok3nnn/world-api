import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublisher, listPublishers } from "@/features/catalog/data/queries";
import { PublisherProfile } from "@/features/publishers/components/publisher-profile";
import { PublisherProfileSkeleton } from "@/features/publishers/components/publisher-profile-skeleton";

export async function generateStaticParams() {
  const publishers = await listPublishers();
  return publishers.map((publisher) => ({ handle: publisher.handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/publishers/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const publisher = await getPublisher(handle);
  return publisher
    ? { title: publisher.displayName, description: publisher.bio }
    : { title: "Profile not found" };
}

export default function PublisherPage({ params }: PageProps<"/publishers/[handle]">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <Suspense fallback={<PublisherProfileSkeleton />}>
        <PublisherProfile params={params} />
      </Suspense>
    </div>
  );
}
