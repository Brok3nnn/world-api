"use client";

import { SectionNav } from "@/components/shared/section-nav";
import { keysOf } from "@/lib/object";
import { SETTINGS_SECTIONS } from "../lib/settings-sections";

const SECTIONS = keysOf(SETTINGS_SECTIONS).map((id) => ({ id, ...SETTINGS_SECTIONS[id] }));

/** Section links of the settings page. */
export function SettingsNav() {
  return <SectionNav label="Settings sections" sections={SECTIONS} />;
}
