"use client";

import { FilePlus2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { InkButton, Modal } from "@/components/anime-ui/ui";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateSelectionCard } from "@/features/templates/template-selection-card";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useLocale } from "@/lib/i18n";

import "@/features/templates/classic-template";
import "@/features/templates/header-full-width-template";
import "@/features/templates/sidebar-left-template";
import "@/features/templates/timeline-block-template";
import "@/features/templates/line-separate-template";
import "@/features/templates/section-banner-template";

/**
 * 新建简历模板选择弹窗。
 * 展示内置模板缩略图；点击即创建并跳转编辑器。
 */
export function NewResumeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const syncResumeToDirectory = useDirectorySyncStore((s) => s.syncResume);
  const { locale, t } = useLocale();

  const templateEntries = useMemo(
    () => listTemplates().filter((e) => e.id !== "blank"),
    [],
  );
  const handleSelectTemplate = async (templateId: string) => {
    const factory = builtinTemplateFactories[templateId];
    if (!factory) return;
    const resume = factory(locale);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResume: ResumeDocument = {
      ...resume,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await saveResume(newResume);
    await syncResumeToDirectory(newResume);
    router.push(`/resume/${id}`);
  };

  return (
    <Modal
      appearance="glass"
      ariaLabelledby="new-resume-title"
      className="flex max-h-[94vh] flex-col"
      onClose={onClose}
      open={open}
      size="lg"
    >
      <div className="glass-modal-header border-b px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/40 bg-cyan-100/16 text-cyan-50">
            <FilePlus2 size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 pt-1">
            <span className="text-xs font-black tracking-[0.18em] text-cyan-100">
              {t.newResume.badge}
            </span>
            <h2 className="mt-1 text-2xl font-black" id="new-resume-title">
              {t.newResume.title}
            </h2>
          </div>
        </div>
        <InkButton
          aria-label={t.newResume.close}
          className="absolute right-4 top-4"
          iconOnly
          onClick={onClose}
          size="icon"
          type="button"
          variant="glass"
        >
          <X size={20} />
        </InkButton>
      </div>

      <div className="glass-modal-body scrollbar-thin min-h-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* 模板卡片 */}
          {templateEntries.map((entry) => (
            <TemplateSelectionCard
              key={entry.id}
              entry={entry}
              onSelect={() => handleSelectTemplate(entry.id)}
            />
          ))}
        </div>
      </div>

      <footer className="glass-modal-footer shrink-0 border-t px-5 py-3 text-center text-xs font-medium text-white/62">
        {t.newResume.footer}
      </footer>
    </Modal>
  );
}
