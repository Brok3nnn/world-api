"use client";

import {
  CoinsIcon,
  LayersIcon,
  LogOutIcon,
  PlugIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AgentSetupDialog } from "@/components/layout/agent-setup-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { PublisherAvatar } from "@/features/catalog/components/publisher-avatar";
import { publisherHref } from "@/features/catalog/lib/endpoint-urls";
import { formatNumber } from "@/lib/format";
import { useSession } from "../hooks/use-session";
import type { Viewer } from "../types";
import { AuthDialog, type AuthMode } from "./auth-dialog";

interface AccountMenuProps {
  viewer: Viewer;
}

const MENU_ITEM = "gap-2.5 rounded-lg px-2.5 py-2";

/**
 * Right side of the header. Signed in: credits, "Create" and the avatar menu. Signed out:
 * "Log in" and "Sign up".
 */
export function AccountMenu({ viewer }: AccountMenuProps) {
  const { state, signOut } = useSession();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const displayName = state.displayName ?? viewer.displayName;

  if (!state.signedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setAuthMode("log-in")}>
          Log in
        </Button>
        <Button variant="brand" onClick={() => setAuthMode("sign-up")}>
          Sign up
        </Button>
        <AuthDialog mode={authMode} onModeChange={setAuthMode} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="brand" nativeButton={false} render={<Link href="/create" />}>
        <PlusIcon aria-hidden data-icon="inline-start" />
        Create
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="rounded-full outline-none transition-opacity hover:opacity-85 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <PublisherAvatar name={displayName} seed={viewer.handle} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5">
          <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
            <PublisherAvatar name={displayName} seed={viewer.handle} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-950 text-sm">{displayName}</p>
              <p className="truncate text-muted-foreground text-xs">@{viewer.handle}</p>
            </div>
          </div>

          <div className="mx-1 mb-1.5 flex flex-col gap-2 rounded-xl bg-lilac-50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700">
                <CoinsIcon aria-hidden className="size-3.5" />
                {formatNumber(viewer.creditsRemaining)} credits
              </span>
              <span className="text-muted-foreground">
                of {formatNumber(viewer.monthlyFreeCredits)} free
              </span>
            </div>
            <Progress
              aria-label="Free credits left this month"
              value={(viewer.creditsRemaining / viewer.monthlyFreeCredits) * 100}
              indicatorClassName="bg-violet-600"
            />
          </div>

          <DropdownMenuItem
            className={MENU_ITEM}
            render={<Link href={publisherHref(viewer.handle)} />}
          >
            <UserIcon aria-hidden />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className={MENU_ITEM} render={<Link href="/my-apis" />}>
            <LayersIcon aria-hidden />
            My APIs
          </DropdownMenuItem>
          <DropdownMenuItem className={MENU_ITEM} render={<Link href="/settings" />}>
            <SettingsIcon aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className={MENU_ITEM} onClick={() => setAgentDialogOpen(true)}>
            <PlugIcon aria-hidden />
            Connect agents
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className={MENU_ITEM} onClick={signOut}>
            <LogOutIcon aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AgentSetupDialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen} />
    </div>
  );
}
