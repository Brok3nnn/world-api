"use client";

import { LockKeyholeIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "../hooks/use-session";
import { AuthDialog, type AuthMode } from "./auth-dialog";

interface AuthGateProps {
  /** What signing in unlocks, e.g. "your APIs". */
  subject: string;
  children: ReactNode;
}

/** Shows its children to signed-in visitors and a sign-in prompt to everyone else. */
export function AuthGate({ subject, children }: AuthGateProps) {
  const { state } = useSession();
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  if (state.signedIn) {
    return children;
  }

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-lilac-50 text-violet-700 ring-1 ring-lilac-100">
        <LockKeyholeIcon aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-ink-950">Log in to see {subject}</h1>
        <p className="text-muted-foreground text-sm">It takes one email. No card needed.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setAuthMode("log-in")}>
          Log in
        </Button>
        <Button variant="brand" onClick={() => setAuthMode("sign-up")}>
          Sign up
        </Button>
      </div>
      <AuthDialog mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
}
