/** Layout-matching placeholder shown while a profile page resolves its URL. */
export function PublisherProfileSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <p className="sr-only">Loading profile…</p>
      <div className="h-28 rounded-3xl bg-ink-50 motion-safe:animate-pulse md:h-36" />
      <div className="flex flex-col gap-3 px-1 sm:px-4">
        <div className="-mt-10 size-20 rounded-full bg-ink-100 ring-4 ring-background" />
        <div className="h-8 w-56 rounded-xl bg-ink-50 motion-safe:animate-pulse" />
        <div className="h-4 w-40 rounded-xl bg-ink-50 motion-safe:animate-pulse" />
      </div>
      <div className="h-64 rounded-2xl bg-ink-50 motion-safe:animate-pulse" />
    </div>
  );
}
