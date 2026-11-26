import { cn } from "cn";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons aligned to the end of the header on wide screens. */
  actions?: ReactNode;
  className?: string;
}

/** Standard page header: eyebrow, title, one-line description and optional actions. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow}
        <h1 className="font-heading text-4xl text-ink-950 md:text-5xl">{title}</h1>
        {description ? (
          <p className="text-pretty text-base text-muted-foreground md:text-lg">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
