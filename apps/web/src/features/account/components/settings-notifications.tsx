"use client";

import { CalendarDaysIcon, CoinsIcon, HammerIcon, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type NotificationPreferences, useSession } from "../hooks/use-session";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

interface NotificationOption {
  key: keyof NotificationPreferences;
  icon: LucideIcon;
  title: string;
  description: string;
}

const NOTIFICATION_OPTIONS: readonly NotificationOption[] = [
  {
    key: "buildFinished",
    icon: HammerIcon,
    title: "Build finished",
    description: "When your requested API is ready.",
  },
  {
    key: "lowCredits",
    icon: CoinsIcon,
    title: "Low credits",
    description: "When credits are about to run out.",
  },
  {
    key: "weeklySummary",
    icon: CalendarDaysIcon,
    title: "Weekly summary",
    description: "Calls and builds, once a week.",
  },
];

/** Email preferences, saved to the session the moment a switch is flipped. */
export function SettingsNotifications() {
  const { state, update } = useSession();

  return (
    <SettingsSection id="notifications" description="Choose what we email you about.">
      <ul className="divide-y">
        {NOTIFICATION_OPTIONS.map(({ key, icon, title, description }) => {
          const switchId = `settings-notification-${key}`;
          const descriptionId = `${switchId}-description`;
          return (
            <SettingsRow
              key={key}
              icon={icon}
              title={<label htmlFor={switchId}>{title}</label>}
              description={<span id={descriptionId}>{description}</span>}
            >
              <Switch
                id={switchId}
                aria-describedby={descriptionId}
                checked={state.notifications[key]}
                onCheckedChange={(checked) =>
                  update({ notifications: { ...state.notifications, [key]: checked } })
                }
              />
            </SettingsRow>
          );
        })}
      </ul>
    </SettingsSection>
  );
}
