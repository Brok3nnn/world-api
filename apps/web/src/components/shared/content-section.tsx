import { cn } from "cn";
import type { ReactNode } from "react";

interface ContentSectionProps {
  /** Anchor id; the heading gets `${id}-title`. */
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled, linkable block of page content with a serif `h2`. */
export function ContentSection({
  id,
  title,
  description,
  children,
  className,
}: ContentSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("flex scroll-mt-8 flex-col gap-5", className)}
    >
      <div className="flex flex-col gap-1.5">
        <h2 id={titleId} className="font-heading text-2xl text-ink-950 md:text-3xl">
          {title}
        </h2>
        {description ? <p className="text-pretty text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
