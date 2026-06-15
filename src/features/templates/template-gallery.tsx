"use client";

import { Eye, FilePlus2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { InkButton, Modal, PageContainer, PageHeading, StickerCard } from "@/components/anime-ui/ui";
import { useOverlay } from "@/hooks/use-overlay";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { saveResume } from "@/features/storage/resume-repository";
import { ClassicTemplatePage } from "./classic-template";
import { buildResumePages } from "./resume-pages";
import { TemplateThumbnail } from "./template-thumbnail";

/** 模板选择页：展示可用模板、预览弹窗与一键使用 */
export function TemplateGallery() {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sampleResume = useMemo(
    () => createDefaultResume("classic-template-preview", "经典单栏模板"),
    [],
  );
  const samplePage = useMemo(
    () => buildResumePages(sampleResume)[0],
    [sampleResume],
  );

  useOverlay(previewOpen, {
    focusRef: closeButtonRef,
    onClose: () => setPreviewOpen(false),
  });

  const useTemplate = async () => {
    const id = crypto.randomUUID();
    await saveResume(createDefaultResume(id, "经典单栏简历"));
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
            subtitle="V1 先把一套模板做好。后续模板会沿用同一数据结构。"
          />
        </div>
        <div className="rounded-2xl border-2 border-black bg-(--yellow) px-4 py-3 font-black shadow-[3px_3px_0_black]">
          1 套可用模板
        </div>
      </div>

      <div
        className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3"
        data-testid="template-grid"
      >
        <StickerCard className="overflow-hidden" data-testid="template-card">
          <TemplateThumbnail page={samplePage} resume={sampleResume} />
          <div className="p-5 lg:p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black">经典单栏</h2>
                <p className="mt-1 text-sm text-black/50">
                  克制、清晰、适合大多数岗位
                </p>
              </div>
              <Sparkles className="text-(--orange)" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InkButton
                aria-haspopup="dialog"
                onClick={() => setPreviewOpen(true)}
                variant="paper"
              >
                <Eye size={17} />
                预览
              </InkButton>
              <InkButton
                aria-label="使用经典单栏模板"
                className="max-lg:gap-0"
                onClick={useTemplate}
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
              经典单栏模板预览
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
              <ClassicTemplatePage
                page={samplePage}
                resume={sampleResume}
              />
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t-2 border-black bg-(--paper) p-4 sm:p-5">
          <InkButton
            className="w-full text-base sm:text-lg"
            onClick={useTemplate}
            variant="dark"
          >
            使用此模板
          </InkButton>
        </footer>
      </Modal>
    </PageContainer>
  );
}
