import type { ReactNode } from "react";
import { SETTINGS_SECTIONS, type SettingsSectionId } from "../lib/settings-sections";

interface SettingsSectionProps {
  /** Anchor id; also selects the title, so the card always matches its nav link. */
  id: SettingsSectionId;
  /** One short helper line under the title. */
  description: string;
  /** Control next to the title, e.g. "Create key". */
  action?: ReactNode;
  children: ReactNode;
}

/** One card of the settings page: a titled, linkable group of settings. */
export function SettingsSection({ id, description, action, children }: SettingsSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-border md:p-6"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-heading text-ink-950 text-xl">
            {SETTINGS_SECTIONS[id].label}
          </h2>
          {action ? <div className="-my-1 shrink-0">{action}</div> : null}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}
