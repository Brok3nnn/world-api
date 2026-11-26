import { CompassIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="font-semibold text-7xl text-ink-200 tabular-nums">404</span>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl text-ink-950">This page does not exist.</h1>
        <p className="text-muted-foreground">Explore the catalog or create the API you need.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" nativeButton={false} render={<Link href="/marketplace" />}>
          <CompassIcon aria-hidden data-icon="inline-start" />
          Explore
        </Button>
        <Button variant="brand" nativeButton={false} render={<Link href="/create" />}>
          <PlusIcon aria-hidden data-icon="inline-start" />
          Create API
        </Button>
      </div>
    </main>
  );
}
