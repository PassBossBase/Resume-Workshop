"use client";

import { Eye, FilePlus2, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  InkButton,
  Modal,
  PageContainer,
  PageHeading,
  StickerCard,
} from "@/components/anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { buildResumePages } from "./resume-pages";
import { getTemplate, listTemplates } from "./template-registry";
import { TemplateThumbnail } from "./template-thumbnail";

// 确保所有渲染器模块被加载并注册
import "./blank-template";
import "./classic-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";

/** 模板选择页：展示可用模板、预览弹窗与一键使用 */
export function TemplateGallery() {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 从注册表获取全部模板
  const templateEntries = useMemo(() => listTemplates(), []);

  // 为当前选中的模板构建预览数据
  const previewResume = useMemo(() => {
    const entry = templateEntries[selectedIndex];
    const factory = entry ? builtinTemplateFactories[entry.id] : undefined;
    if (factory) return factory();
    return createDefaultResume("preview", "预览简历");
  }, [selectedIndex, templateEntries]);
  const previewPage = useMemo(
    () => buildResumePages(previewResume)[0],
    [previewResume],
  );

  useOverlay(previewOpen, {
    focusRef: closeButtonRef,
    onClose: () => setPreviewOpen(false),
  });

  const openPreview = (index: number) => {
    setSelectedIndex(index);
    setPreviewOpen(true);
  };

  const applyTemplate = async (index: number) => {
    const entry = templateEntries[index];
    const factory = entry ? builtinTemplateFactories[entry.id] : undefined;
    if (!factory) return;
    const resume = factory();
    // 生成新的 ID 和时间戳，作为一份全新的简历
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResume = { ...resume, id, createdAt: now, updatedAt: now };
    await saveResume(newResume);
    router.push(`/resume/${id}`);
  };

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <PageHeading
            badge="TEMPLATE CLUB"
            badgeColor="bg-(--pink)"
            badgeTextColor="text-white"
            badgeRotation="-rotate-1"
            title="简历模板"
            subtitle="选择一套模板作为起点，快速生成你的简历。"
          />
        </div>
        {/* <InkButton variant="paper">
          <Plus size={18} />
          添加模板
        </InkButton> */}
      </div>

      <div
        className="mt-8 grid gap-7 sm:grid-cols-2 xl:grid-cols-3"
        data-testid="template-grid"
      >
        {templateEntries.map((entry, index) => {
          const resume = (() => {
            const factory = builtinTemplateFactories[entry.id];
            return factory
              ? factory()
              : createDefaultResume("thumb", entry.name);
          })();
          const page = buildResumePages(resume)[0];

          return (
            <StickerCard
              className="overflow-hidden"
              data-testid="template-card"
              key={entry.id}
            >
              <TemplateThumbnail page={page} resume={resume} />
              <div className="p-5 lg:p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black">{entry.name}</h2>
                    <p className="mt-1 text-sm text-black/50">
                      {entry.description}
                    </p>
                  </div>
                  <Sparkles className="text-(--orange)" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <InkButton
                    aria-haspopup="dialog"
                    aria-label={`预览${entry.name}模板`}
                    className="max-lg:gap-0"
                    onClick={() => openPreview(index)}
                    title="预览"
                    variant="paper"
                  >
                    <Eye size={17} />
                    <span className="max-lg:sr-only">
                      预览
                    </span>
                  </InkButton>
                  <InkButton
                    aria-label={`使用${entry.name}模板`}
                    className="max-lg:gap-0"
                    onClick={() => applyTemplate(index)}
                    title="使用"
                    variant="yellow"
                  >
                    <FilePlus2 size={17} />
                    <span className="max-lg:sr-only" data-template-action-label>
                      使用
                    </span>
                  </InkButton>
                </div>
              </div>
            </StickerCard>
          );
        })}
      </div>

      <Modal
        ariaLabelledby="template-preview-title"
        className="flex max-h-[94vh] flex-col"
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        size="lg"
      >
        <header className="flex shrink-0 items-center justify-between border-b-2 border-black bg-white px-5 py-4 sm:px-7">
          <div>
            <span className="text-xs font-black tracking-[0.2em] text-(--pink)">
              TEMPLATE PREVIEW
            </span>
            <h2
              className="mt-1 text-xl font-black sm:text-2xl"
              id="template-preview-title"
            >
              {templateEntries[selectedIndex]?.name ?? ""}模板预览
            </h2>
          </div>
          <button
            aria-label="关闭模板预览"
            className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-black bg-white transition hover:-translate-y-0.5 hover:bg-(--yellow) hover:shadow-[3px_3px_0_black]"
            onClick={() => setPreviewOpen(false)}
            ref={closeButtonRef}
            type="button"
          >
            <X />
          </button>
        </header>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-auto bg-[#e7ebf1] p-4 sm:p-8">
          <div className="template-dialog-page mx-auto shadow-[0_20px_60px_rgb(30_40_60/25%)]">
            <div>
              {(() => {
                const entry = getTemplate(previewResume.templateId);
                const Renderer = entry?.component;
                if (!Renderer) return null;
                return <Renderer page={previewPage} resume={previewResume} />;
              })()}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t-2 border-black bg-(--paper) p-4 sm:p-5">
          <InkButton
            className="w-full text-base sm:text-lg"
            onClick={() => applyTemplate(selectedIndex)}
            variant="dark"
          >
            使用此模板
          </InkButton>
        </footer>
      </Modal>
    </PageContainer>
  );
}
