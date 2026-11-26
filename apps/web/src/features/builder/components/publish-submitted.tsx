"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PublishSubmittedProps {
  /** Name of the API that was just submitted. */
  name: string;
  /** Starts a fresh wizard. */
  onRestart: () => void;
}

/** Confirmation shown in place of the wizard once an API has been sent for review. */
export function PublishSubmitted({ name, onRestart }: PublishSubmittedProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The form that had focus is gone; move focus to the result so it is announced.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex max-w-3xl flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-14 text-center md:py-16">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
        <CheckIcon aria-hidden className="size-6" />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 font-heading text-2xl text-ink-950 outline-none"
      >
        Sent for review
      </h2>
      <p className="max-w-sm text-pretty text-muted-foreground text-sm">
        “{name}” goes live once it passes review. We email you either way.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Button variant="brand" nativeButton={false} render={<Link href="/my-apis" />}>
          Go to My APIs
        </Button>
        <Button type="button" variant="outline" onClick={onRestart}>
          Share more data
        </Button>
      </div>
    </div>
  );
}
