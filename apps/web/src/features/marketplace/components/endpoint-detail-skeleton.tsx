import { cn } from "cn";

function Block({ className }: { className: string }) {
  return <div className={cn("rounded-xl bg-ink-50 motion-safe:animate-pulse", className)} />;
}

/** Layout-matching placeholder shown while the endpoint page resolves its URL. */
export function EndpointDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-10">
      <p className="sr-only">Loading endpoint…</p>
      <div className="flex flex-col gap-6">
        <Block className="h-4 w-56" />
        <div className="flex items-start gap-4">
          <Block className="size-12 shrink-0" />
          <div className="flex flex-1 flex-col gap-3">
            <Block className="h-10 w-3/4 max-w-lg" />
            <Block className="h-4 w-48" />
          </div>
        </div>
        <Block className="h-12 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Block className="h-96" />
        <Block className="h-72" />
      </div>
    </div>
  );
}
