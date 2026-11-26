import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PrototypeNotice } from "@/components/layout/prototype-notice";
import { AccountMenu } from "@/features/account/components/account-menu";
import { getViewer } from "@/features/account/data/queries";
import { listEndpointSummaries } from "@/features/catalog/data/queries";
import { CommandMenu } from "@/features/search/components/command-menu";

export default async function PlatformLayout({ children }: LayoutProps<"/">) {
  const [viewer, endpoints] = await Promise.all([getViewer(), listEndpointSummaries()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <PrototypeNotice />
      <AppHeader
        search={<CommandMenu endpoints={endpoints} />}
        account={<AccountMenu viewer={viewer} />}
      />
      <main id="main" className="min-h-[calc(100dvh-4rem)]">
        {children}
      </main>
      <div className="pb-16 md:pb-0">
        <AppFooter />
      </div>
      <MobileNav />
    </>
  );
}
