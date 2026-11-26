import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import type { Endpoint } from "@/features/catalog/types";

interface EndpointBreadcrumbProps {
  endpoint: Endpoint;
}

/** Explore / @publisher (their profile) / slug */
export function EndpointBreadcrumb({ endpoint }: EndpointBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/marketplace" />}>Explore</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={publisherHref(endpoint.publisherHandle)} />}>
            @{endpoint.publisherHandle}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{endpoint.slug}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
