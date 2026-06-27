import { AppShell } from "@/components/app-shell";
import { TemplateGallery } from "@/features/templates/template-gallery";

export default function TemplatesPage() {
  return (
    <AppShell>
      <div className="h-screen overflow-hidden">
        <TemplateGallery />
      </div>
    </AppShell>
  );
}
