"use client";

import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/shared/copy-button";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/account/hooks/use-session";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { PublisherBadges } from "@/features/catalog/components/publisher-badges";
import type { Publisher } from "@/features/catalog/types";
import { formatMonthYear } from "@/lib/format";

interface ProfileIdentityProps {
  publisher: Publisher;
  /** Absolute URL of this profile, for the share button. */
  shareUrl: string;
  /** True when the profile belongs to the signed-in account. */
  own: boolean;
}

/** Avatar, name, handle, bio and actions of a profile. Shows the owner's unsaved-to-server edits. */
export function ProfileIdentity({ publisher, shareUrl, own }: ProfileIdentityProps) {
  const { state } = useSession();
  const editable = own && state.signedIn;
  const displayName = (editable ? state.displayName : null) ?? publisher.displayName;
  const bio = (editable ? state.bio : null) ?? publisher.bio;

  return (
    <div className="flex flex-col gap-4 px-1 sm:px-4">
      {/* Positioned so the avatar paints over the banner it overlaps. */}
      <div className="relative -mt-10 flex items-end justify-between gap-4">
        <PublisherAvatar
          name={displayName}
          seed={publisher.handle}
          size="xl"
          className="ring-4 ring-background"
        />
        <div className="flex items-center gap-2 pb-1">
          <CopyButton value={shareUrl} label="Copy profile link" text="Share" variant="outline" />
          {editable ? (
            <Button
              variant="secondary"
              size="sm"
              nativeButton={false}
              render={<Link href="/settings" />}
            >
              <SettingsIcon aria-hidden data-icon="inline-start" />
              Edit profile
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="font-heading text-3xl text-ink-950">{displayName}</h1>
          <PublisherBadges publisher={publisher} />
        </div>
        <p className="text-muted-foreground text-sm">
          @{publisher.handle} · Joined {formatMonthYear(publisher.joinedAt)}
        </p>
        <p className="max-w-prose text-pretty text-ink-800">{bio}</p>
      </div>
    </div>
  );
}
