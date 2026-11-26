import type { Metadata } from "next";
import { Eyebrow } from "@/components/shared/eyebrow";
import { PageHeader } from "@/components/shared/page-header";
import { DocsReference } from "@/features/docs/components/docs-reference";
import { DocsStartCards } from "@/features/docs/components/docs-start-cards";
import { DocsToc } from "@/features/docs/components/docs-toc";

export const metadata: Metadata = {
  title: "Docs",
  description: "One endpoint, a few parameters, one response envelope. The whole API on one page.",
};

export default function DocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow={<Eyebrow>Docs</Eyebrow>}
        title="The whole API on one page"
        description="One link, a few options, one answer format."
      />
      <DocsStartCards />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <DocsToc />
        <DocsReference />
      </div>
    </div>
  );
}
