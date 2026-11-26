import type { Route } from "next";
import { siteConfig } from "@/config/site";
import type { Endpoint, Shape } from "../types";

type EndpointRef = Pick<Endpoint, "publisherHandle" | "slug">;

interface ApiUrlOptions {
  shape?: Shape;
  ask?: string;
}

/** Public GET URL of an endpoint, e.g. https://api.example.com/@mira_field/forest-cam-12?shape=number */
export function endpointApiUrl(endpoint: EndpointRef, options: ApiUrlOptions = {}): string {
  const url = new URL(`/@${endpoint.publisherHandle}/${endpoint.slug}`, siteConfig.apiBaseUrl);
  if (options.shape && options.shape !== "json") {
    url.searchParams.set("shape", options.shape);
  }
  if (options.ask) {
    url.searchParams.set("ask", options.ask);
  }
  return decodeURI(url.toString());
}

/** In-app detail page of an endpoint. */
export function endpointHref(endpoint: EndpointRef): Route {
  // Handles and slugs are single URL segments (never contain "/"), so this matches the route.
  return `/marketplace/${endpoint.publisherHandle}/${endpoint.slug}` as Route;
}

/** In-app profile page of a publisher. */
export function publisherHref(handle: string): Route {
  // Handles are single URL segments (never contain "/"), so this matches the route.
  return `/publishers/${handle}` as Route;
}
