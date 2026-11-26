import { BellIcon, CoinsIcon, KeyRoundIcon, type LucideIcon, UserIcon } from "lucide-react";

interface SettingsSectionMeta {
  label: string;
  icon: LucideIcon;
}

/** Sections of the settings page in display order. The key is the anchor id of the section. */
export const SETTINGS_SECTIONS = {
  profile: { label: "Profile", icon: UserIcon },
  "api-keys": { label: "API keys", icon: KeyRoundIcon },
  notifications: { label: "Notifications", icon: BellIcon },
  credits: { label: "Credits", icon: CoinsIcon },
} as const satisfies Record<string, SettingsSectionMeta>;

export type SettingsSectionId = keyof typeof SETTINGS_SECTIONS;
