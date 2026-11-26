import { cn } from "cn";
import Image from "next/image";
import type { ReactNode } from "react";
import { coverSrc } from "../lib/cover-src";
import type { CoverId } from "../types";

interface EndpointCoverProps {
  cover: CoverId;
  /** Content laid over the artwork, such as badges. Position it absolutely. */
  children?: ReactNode;
  /** Load eagerly for covers that are above the fold. */
  priority?: boolean;
  className?: string;
  /** Extra classes for the photo itself, e.g. a hover zoom. */
  imageClassName?: string;
  /** Rendered width hint for the image loader. Defaults to the card grid; pass a fixed width for thumbnails. */
  sizes?: string;
}

const GRID_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw";

/** Cover photo of an endpoint with an optional overlay. Decorative: the title names the data. */
export function EndpointCover({
  cover,
  children,
  priority = false,
  className,
  imageClassName,
  sizes = GRID_SIZES,
}: EndpointCoverProps) {
  return (
    // No stacking context here: overlaid controls must be able to rise above a card's link.
    <div className={cn("relative overflow-hidden bg-cobalt-100", className)}>
      <Image
        src={coverSrc(cover)}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
      />
      {children}
    </div>
  );
}
