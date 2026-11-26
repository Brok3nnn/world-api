import { cn } from "cn";
import type { ReactNode } from "react";

interface BracketFrameProps {
  children: ReactNode;
  className?: string;
}

const CORNERS = [
  "-top-2.5 -left-2.5 rounded-tl-xl border-t-2 border-l-2",
  "-top-2.5 -right-2.5 rounded-tr-xl border-t-2 border-r-2",
  "-bottom-2.5 -left-2.5 rounded-bl-xl border-b-2 border-l-2",
  "-right-2.5 -bottom-2.5 rounded-br-xl border-r-2 border-b-2",
] as const;

/** White corner brackets that frame the one focal element on a colored surface. */
export function BracketFrame({ children, className }: BracketFrameProps) {
  return (
    <div className={cn("relative", className)}>
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden
          className={cn("pointer-events-none absolute size-5 border-white/70", corner)}
        />
      ))}
      {children}
    </div>
  );
}
