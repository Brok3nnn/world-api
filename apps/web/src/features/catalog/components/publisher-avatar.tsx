import { cn } from "cn";

interface PublisherAvatarProps {
  /** Shown as initials. */
  name: string;
  /** Stable id (a handle) that picks the color. Defaults to the name. */
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "size-6 text-[0.625rem]",
  md: "size-9 text-xs",
  lg: "size-12 text-base",
  xl: "size-20 text-2xl",
} as const;

const GRADIENTS = [
  "from-cobalt-500 to-violet-600",
  "from-violet-500 to-coral-500",
  "from-mint-400 to-cobalt-600",
  "from-amber-400 to-coral-500",
  "from-cobalt-300 to-cobalt-700",
  "from-lilac-400 to-violet-700",
] as const;

/** Initials avatar on a gradient. People and publishers have no profile images yet. */
export function PublisherAvatar({
  name,
  seed = name,
  size = "md",
  className,
}: PublisherAvatarProps) {
  const initials = name
    .replace(/^@/, "")
    .split(/[\s_]+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  const hash = [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-linear-to-br font-semibold text-white ring-2 ring-background",
        GRADIENTS[hash % GRADIENTS.length],
        SIZES[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
