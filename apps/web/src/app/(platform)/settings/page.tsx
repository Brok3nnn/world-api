import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AuthGate } from "@/features/account/components/auth-gate";
import { SettingsApiKeys } from "@/features/account/components/settings-api-keys";
import { SettingsCredits } from "@/features/account/components/settings-credits";
import { SettingsNav } from "@/features/account/components/settings-nav";
import { SettingsNotifications } from "@/features/account/components/settings-notifications";
import { SettingsProfile } from "@/features/account/components/settings-profile";
import { getViewer } from "@/features/account/data/queries";
import { getPublisher } from "@/features/catalog/data/queries";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your profile, API keys, notifications and credits.",
};

export default async function SettingsPage() {
  const viewer = await getViewer();
  // The bio lives on the viewer's publisher record, the same one their public profile shows.
  const publisher = await getPublisher(viewer.handle);

  return (
    <AuthGate subject="your settings">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-10">
        <PageHeader title="Settings" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
          <SettingsNav />
          <div className="flex min-w-0 flex-col gap-4 md:gap-6">
            <SettingsProfile viewer={viewer} storedBio={publisher?.bio ?? ""} />
            <SettingsApiKeys />
            <SettingsNotifications />
            <SettingsCredits viewer={viewer} />
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
