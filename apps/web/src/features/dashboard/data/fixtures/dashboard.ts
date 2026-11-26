import type { BuildInProgress, OwnedEndpoint } from "../../types";

export const ownedEndpointFixtures: readonly OwnedEndpoint[] = [
  {
    id: "ep_rooftop_pm25",
    slug: "district-7-air",
    title: "Rooftop air",
    cover: "city",
    status: "live",
    visibility: "public",
    refresh: "1m",
    paidCalls30d: 88_000,
    uptime: 0.9969,
  },
  {
    id: "own_night_noise",
    slug: "district-7-night-noise",
    title: "Night-time noise, District 7",
    cover: "transit",
    status: "degraded",
    visibility: "unlisted",
    refresh: "15m",
    paidCalls30d: 6_400,
    uptime: 0.9712,
  },
  {
    id: "own_morning_mix",
    slug: "district-7-morning-mix",
    title: "District 7 morning mix",
    cover: "sunrise",
    status: "live",
    visibility: "private",
    refresh: "15m",
    paidCalls30d: 2_900,
    uptime: 0.999,
  },
  {
    id: "own_balcony_pollen",
    slug: "balcony-pollen-count",
    title: "Balcony pollen count",
    cover: "field",
    status: "building",
    visibility: "private",
    refresh: "1h",
    paidCalls30d: 0,
    uptime: null,
  },
];

export const buildInProgressFixtures: readonly BuildInProgress[] = [
  {
    id: "build_balcony_pollen",
    title: "Balcony pollen count",
    currentStep: "Sandbox tests · 12 of 20 trial runs",
    progress: 0.66,
  },
  {
    id: "build_tree_shade",
    title: "Street tree canopy shade",
    currentStep: "Legal filter · 2 of 3 sources checked",
    progress: 0.3,
  },
];
