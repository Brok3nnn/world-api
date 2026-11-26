/** Static placeholder with the workspace's layout while the URL state loads. */
export function CreateWorkspaceFallback() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="h-11 w-full rounded-xl bg-muted sm:w-80" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="h-32 rounded-2xl bg-ink-50 motion-safe:animate-pulse" />
          <div className="h-14 rounded-2xl bg-ink-50 motion-safe:animate-pulse" />
        </div>
        <div className="h-96 rounded-2xl bg-ink-50 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
