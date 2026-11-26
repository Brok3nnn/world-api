import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMMUNITY_TAB_LABELS, COMMUNITY_TABS, type CommunityTab } from "../constants";

interface CommunityTabsViewProps {
  value: CommunityTab;
  /** Omitted for the static prerendered fallback, which always shows the default tab. */
  onValueChange?: (value: CommunityTab) => void;
  panels: Record<CommunityTab, ReactNode>;
}

/** Presentational community tabs. `CommunityTabs` binds them to the URL. */
export function CommunityTabsView({ value, onValueChange, panels }: CommunityTabsViewProps) {
  return (
    <Tabs
      value={value}
      // No handler on the server-rendered fallback: functions cannot cross into client components.
      onValueChange={
        onValueChange &&
        ((next) => {
          if (isCommunityTab(next)) {
            onValueChange(next);
          }
        })
      }
      className="min-w-0 gap-6"
    >
      <TabsList
        aria-label="Community views"
        className="max-w-full overflow-x-auto rounded-full p-1 ring-1 ring-border group-data-horizontal/tabs:h-10"
      >
        {COMMUNITY_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="rounded-full px-4">
            {COMMUNITY_TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>
      {COMMUNITY_TABS.map((tab) => (
        <TabsContent key={tab} value={tab}>
          {panels[tab]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function isCommunityTab(value: unknown): value is CommunityTab {
  return COMMUNITY_TABS.some((tab) => tab === value);
}
