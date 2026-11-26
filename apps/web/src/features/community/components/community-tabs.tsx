"use client";

import { useQueryState } from "nuqs";
import type { ReactNode } from "react";
import type { CommunityTab } from "../constants";
import { communitySearchParams } from "../search-params";
import { CommunityTabsView } from "./community-tabs-view";

interface CommunityTabsProps {
  panels: Record<CommunityTab, ReactNode>;
}

/** Community tabs with the active tab stored in the `tab` URL parameter. */
export function CommunityTabs({ panels }: CommunityTabsProps) {
  const [tab, setTab] = useQueryState("tab", communitySearchParams.tab);

  return (
    <CommunityTabsView
      value={tab}
      onValueChange={(next) => {
        void setTab(next);
      }}
      panels={panels}
    />
  );
}
