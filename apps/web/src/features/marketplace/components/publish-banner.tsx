import { ArrowRightIcon, CameraIcon, RadioTowerIcon, TableIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { builderUrl } from "@/features/builder/search-params";

const SOURCE_ICONS = [
  { id: "camera", icon: CameraIcon },
  { id: "sensor", icon: RadioTowerIcon },
  { id: "dataset", icon: TableIcon },
] as const;

/** Invitation to owners of cameras, sensors and datasets to share them as APIs. */
export function PublishBanner() {
  return (
    <section
      aria-labelledby="publish-banner-title"
      className="noise flex flex-col gap-5 overflow-hidden rounded-3xl bg-deep p-6 text-white sm:flex-row sm:items-center md:p-8"
    >
      <div aria-hidden className="flex -space-x-2">
        {SOURCE_ICONS.map(({ id, icon: Icon }) => (
          <span
            key={id}
            className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md"
          >
            <Icon className="size-5" />
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <h2 id="publish-banner-title" className="font-heading text-2xl">
          Own a camera, sensor or dataset?
        </h2>
        <p className="mt-1 text-white/80">Share it as an API and set its price per call.</p>
      </div>
      <Button
        variant="inverse"
        size="lg"
        nativeButton={false}
        render={<Link href={builderUrl({ mode: "publish" })} />}
        className="self-start sm:self-auto"
      >
        Share your data
        <ArrowRightIcon aria-hidden data-icon="inline-end" />
      </Button>
    </section>
  );
}
