"use client";

import { FilePlus2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { InkButton, Modal, StickerCard } from "@/components/anime-ui/ui";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { createBlankResume } from "@/features/resume-model/resume-model";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateThumbnail } from "@/features/templates/template-thumbnail";
import { useDirectorySyncStore } from "@/stores/directory-sync-store";
import { useLocale } from "@/lib/i18n";

import "@/features/templates/blank-template";
import "@/features/templates/classic-template";
import "@/features/templates/header-full-width-template";
import "@/features/templates/sidebar-left-template";
import "@/features/templates/timeline-block-template";
import "@/features/templates/line-separate-template";
import "@/features/templates/section-banner-template";

/**
 * 新建简历模板选择弹窗。
 * 首位展示基础简历（虚线占位），随后展示全部内置模板缩略图。
 * 点击即创建并跳转编辑器。
 */
export function NewResumeModal({
  open,
  onClose,
  defaultTitle,
}: {
  open: boolean;
  onClose: () => void;
  defaultTitle: string;
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

  const handleCreateBlank = async () => {
    const resume = createBlankResume(crypto.randomUUID(), defaultTitle, locale);
    await saveResume(resume);
    await syncResumeToDirectory(resume);
    router.push(`/resume/${resume.id}`);
  };

  return (
    <Modal
      ariaLabelledby="new-resume-title"
      className="flex max-h-[94vh] flex-col"
      onClose={onClose}
      open={open}
      size="lg"
    >
      {/* ======== Header: comic-dots 风格 ======== */}
      <div className="comic-dots border-b-2 border-black bg-[#eef2ff] px-6 py-5">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 rotate-[-4deg] place-items-center rounded-2xl border-2 border-black bg-(--pink) text-white shadow-[3px_3px_0_black]">
            <FilePlus2 size={28} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 pt-1">
            <span className="text-xs font-black tracking-[0.18em] text-(--blue)">
              {t.newResume.badge}
            </span>
            <h2 className="mt-1 text-2xl font-black" id="new-resume-title">
              {t.newResume.title}
            </h2>
          </div>
        </div>
        <InkButton
          aria-label={t.newResume.close}
          className="absolute right-4 top-4 shadow-[3px_3px_0_var(--line)] hover:bg-(--yellow)"
          iconOnly
          onClick={onClose}
          size="icon"
          type="button"
          variant="paper"
          pressable
        >
          <X size={20} />
        </InkButton>
      </div>

      {/* ======== Body: 卡片网格 ======== */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-(--canvas) p-4 sm:p-6 lg:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* 基础简历（首位，使用空白模板骨架） */}
          <StickerCard
            aria-label={t.templates.useAria(t.newResume.basic)}
            className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden border-0 bg-[#242528] text-white shadow-none hover:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
            onClick={handleCreateBlank}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCreateBlank();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <TemplateThumbnail
              ariaLabel={t.templates.previewAria(t.newResume.basic)}
              className="pointer-events-none h-full"
              templateId="blank"
            />

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-10 bg-[rgba(59,59,203,0.92)] px-5 py-3 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
              <h3 className="truncate text-[16px] font-black text-white">
                {t.newResume.basic}
              </h3>
              <p className="mt-1 truncate text-xs font-medium text-white/90">
                {t.templates.descriptions.blank ?? t.newResume.basicDescription}
              </p>
            </div>
          </StickerCard>

          {/* 模板卡片 */}
          {templateEntries.map((entry) => (
            <StickerCard
              key={entry.id}
              aria-label={t.templates.useAria(t.templates.names[entry.id])}
              className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden border-0 bg-[#242528] text-white shadow-none hover:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
              onClick={() => handleSelectTemplate(entry.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectTemplate(entry.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TemplateThumbnail
                ariaLabel={t.templates.previewAria(t.templates.names[entry.id])}
                className="pointer-events-none h-full"
                templateId={entry.id}
              />

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-10 bg-[rgba(59,59,203,0.92)] px-5 py-3 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
                <h3 className="truncate text-[16px] font-black text-white">
                  {t.templates.names[entry.id]}
                </h3>
                <p className="mt-1 truncate text-xs font-medium text-white/90">
                  {t.templates.descriptions[entry.id]}
                </p>
              </div>
            </StickerCard>
          ))}
        </div>
      </div>

      <footer className="shrink-0 border-t-2 border-black bg-(--paper) px-5 py-3 text-center text-xs font-medium text-black/40">
        {t.newResume.footer}
      </footer>
    </Modal>
  );
}
