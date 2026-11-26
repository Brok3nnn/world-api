import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsRowProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Control or value at the end of the row. */
  children?: ReactNode;
}

/** A list row inside a settings card: icon tile, title, optional one-line detail, then a control. */
export function SettingsRow({ icon: Icon, title, description, children }: SettingsRowProps) {
  return (
    <li className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-violet-700">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="wrap-anywhere font-medium text-ink-950 text-sm">{title}</div>
        {description ? <div className="text-muted-foreground text-xs">{description}</div> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </li>
  );
}
