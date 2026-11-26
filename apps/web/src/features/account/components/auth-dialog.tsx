"use client";

import { MailIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useSession } from "../hooks/use-session";

export type AuthMode = "log-in" | "sign-up";

interface AuthDialogProps {
  /** `null` keeps the dialog closed. */
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode | null) => void;
}

const COPY: Record<AuthMode, { title: string; description: string; switchLabel: string }> = {
  "log-in": {
    title: "Welcome back",
    description: "Prototype: any email signs you in, in this browser only.",
    switchLabel: "New here? Create an account",
  },
  "sign-up": {
    title: "Create your account",
    description: "Prototype: no account is created; any email signs you in, in this browser.",
    switchLabel: "Already have an account? Log in",
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email-first log in / sign up. One dialog, two modes. */
export function AuthDialog({ mode, onModeChange }: AuthDialogProps) {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode ?? "log-in"];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    signIn();
    toast.success(mode === "sign-up" ? "Account created. You are signed in." : "Signed in.");
    setEmail("");
    setError(null);
    onModeChange(null);
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => (open ? undefined : onModeChange(null))}>
      <DialogContent className="gap-6 p-7 sm:max-w-sm">
        <DialogHeader className="items-center gap-3 text-center">
          <BrandMark className="size-11 rounded-2xl" />
          <DialogTitle className="font-heading text-2xl text-ink-950">{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <InputGroup className="h-11 rounded-xl">
            <InputGroupAddon>
              <MailIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              autoComplete="email"
              inputMode="email"
              aria-label="Email"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-email-error" : undefined}
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
            />
          </InputGroup>
          {error ? (
            <p id="auth-email-error" role="alert" className="text-destructive text-xs">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="brand" size="lg" className="w-full">
            Continue
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            onModeChange(mode === "sign-up" ? "log-in" : "sign-up");
          }}
          className="mx-auto rounded-full text-muted-foreground text-sm outline-none transition-colors hover:text-ink-950 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {copy.switchLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}
