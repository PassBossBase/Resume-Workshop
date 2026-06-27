"use client";

import { FilePlus2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { Modal } from "@/components/anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";
import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { createBlankResume } from "@/features/resume-model/resume-model";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "@/features/templates/template-registry";
import { TemplateThumbnail } from "@/features/templates/template-thumbnail";

import "@/features/templates/blank-template";
import "@/features/templates/classic-template";
import "@/features/templates/header-full-width-template";
import "@/features/templates/sidebar-left-template";
import "@/features/templates/timeline-block-template";
import "@/features/templates/line-separate-template";

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useOverlay(open, {
    focusRef: closeButtonRef,
    onClose,
  });

  const templateEntries = useMemo(
    () => listTemplates().filter((e) => e.id !== "blank"),
    [],
  );

  const handleSelectTemplate = async (templateId: string) => {
    const factory = builtinTemplateFactories[templateId];
    if (!factory) return;
    const resume = factory();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResume: ResumeDocument = {
      ...resume,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await saveResume(newResume);
    router.push(`/resume/${id}`);
  };

  const handleCreateBlank = async () => {
    const resume = createBlankResume(crypto.randomUUID(), defaultTitle);
    await saveResume(resume);
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
              CREATE RESUME
            </span>
            <h2 className="mt-1 text-2xl font-black" id="new-resume-title">
              创建简历
            </h2>
          </div>
        </div>
        <button
          aria-label="关闭模板选择"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-black bg-white transition hover:bg-(--yellow)"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      {/* ======== Body: 卡片网格 ======== */}
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-(--canvas) p-4 sm:p-6 lg:p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* 基础简历（首位，虚线占位） */}
          <div
            className="animate-pop cursor-pointer overflow-hidden bg-(--paper) transition hover:ring-2 hover:ring-(--yellow)"
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
            <div className="flex h-64 flex-col items-center justify-center gap-4 border-b-2 border-dashed border-black/20 bg-(--paper)">
              <span className="grid h-16 w-16 rotate-[-3deg] place-items-center rounded-2xl border-2 border-dashed border-black/25 bg-white">
                <FilePlus2
                  size={32}
                  className="text-black/25"
                  strokeWidth={1.5}
                />
              </span>
              <span className="text-base font-black text-black/30">
                从空白开始
              </span>
            </div>
            <div className="py-3.5 text-center">
              <h3 className="text-[15px] font-black">基础简历</h3>
            </div>
          </div>

          {/* 模板卡片 */}
          {templateEntries.map((entry) => (
            <div
              key={entry.id}
              className="animate-pop cursor-pointer overflow-hidden bg-(--paper) transition hover:ring-2 hover:ring-(--yellow)"
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
                ariaLabel={`${entry.name}模板预览`}
                templateId={entry.id}
              />
              <div className="py-3.5 text-center">
                <h3 className="text-[15px] font-black">{entry.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="shrink-0 border-t-2 border-black bg-(--paper) px-5 py-3 text-center text-xs font-medium text-black/40">
        点击任意卡片即可创建简历
      </footer>
    </Modal>
  );
}
