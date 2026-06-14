import { AppShell } from "@/components/app-shell";
import { ResumeDashboard } from "@/features/dashboard/resume-dashboard";

export default function Home() {
  return (
    <AppShell>
      <ResumeDashboard initialResumes={[]} />
    </AppShell>
  );
}
