"use client";

import { Eye, FilePlus2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { InkButton, StickerCard } from "@/components/anime-ui/ui";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { saveResume } from "@/features/storage/resume-repository";
import { ClassicTemplatePage } from "./classic-template";
import { buildResumePages } from "./resume-pages";

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

  useEffect(() => {
    if (!previewOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewOpen]);

  const useTemplate = async () => {
    const id = crypto.randomUUID();
    await saveResume(createDefaultResume(id, "经典单栏简历"));
    router.push(`/resume/${id}`);
  };

  return (
    <div className="mx-auto max-w-375 px-5 py-8 md:px-10 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="inline-block -rotate-1 rounded-full border-2 border-black bg-(--pink) px-4 py-1 text-sm font-black text-white">
            TEMPLATE CLUB
          </span>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">简历模板</h1>
          <p className="mt-3 text-black/55">
            V1 先把一套模板做好。后续模板会沿用同一数据结构。
          </p>
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
          <div className="relative h-64 overflow-hidden border-b-2 border-black bg-[#e7ebf1] lg:h-64">
            <div className="template-thumbnail-page absolute left-1/2 top-4 -translate-x-1/2 shadow-[0_16px_35px_rgb(30_40_60/24%)] lg:top-4">
              <div>
                <ClassicTemplatePage page={samplePage} resume={sampleResume} />
              </div>
            </div>
          </div>
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

      {previewOpen ? (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-black/75 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setPreviewOpen(false);
          }}
        >
          <section
            aria-labelledby="template-preview-title"
            aria-modal="true"
            className="animate-pop flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border-2 border-black bg-(--paper) shadow-[8px_8px_0_black]"
            role="dialog"
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
          </section>
        </div>
      ) : null}
    </div>
  );
}
