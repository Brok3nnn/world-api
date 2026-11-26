import { cn } from "cn";

interface BrandMarkProps {
  className?: string;
}

/**
 * Neutral placeholder for the logo. Branding is intentionally undecided: replace this
 * component's contents (only) when the final mark exists.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "noise inline-flex size-8 items-center justify-center overflow-hidden rounded-[10px] bg-hero shadow-card",
        className,
      )}
    >
      <span className="size-2.5 rounded-full bg-white" />
    </span>
  );
}
