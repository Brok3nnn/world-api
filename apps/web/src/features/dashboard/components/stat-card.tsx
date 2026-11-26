import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  /** Optional visual under the value, e.g. a progress bar. */
  children?: ReactNode;
}

export function StatCard({ label, value, icon: Icon, hint, children }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <dt className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-violet-600">
          <Icon aria-hidden className="size-4" />
        </span>
        {label}
      </dt>
      <dd className="flex flex-col gap-2">
        <span className="font-heading text-3xl text-ink-950 tabular-nums">{value}</span>
        {children}
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </dd>
    </div>
  );
}
