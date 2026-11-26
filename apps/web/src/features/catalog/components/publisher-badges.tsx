import { cn } from "cn";
import { BadgeCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Publisher } from "@/features/catalog/types";

interface PublisherBadgesProps {
  publisher: Pick<Publisher, "kind" | "verified">;
  className?: string;
}

/** Trust badges shown next to a publisher's name. Renders nothing when none apply. */
export function PublisherBadges({ publisher, className }: PublisherBadgesProps) {
  if (publisher.kind !== "platform" && !publisher.verified) {
    return null;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {publisher.kind === "platform" ? <Badge variant="secondary">Platform</Badge> : null}
      {publisher.verified ? (
        <Badge variant="cobalt">
          <BadgeCheckIcon aria-hidden data-icon="inline-start" />
          Verified
        </Badge>
      ) : null}
    </span>
  );
}
