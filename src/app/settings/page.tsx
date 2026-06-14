import { AppShell } from "@/components/app-shell";
import { DirectorySettings } from "@/features/settings/directory-settings";

export default function SettingsPage() {
  return (
    <AppShell>
      <DirectorySettings />
    </AppShell>
  );
}
