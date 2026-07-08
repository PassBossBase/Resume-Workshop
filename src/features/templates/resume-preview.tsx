"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useResumeStore } from "@/stores/resume-store";
import { ClassicTemplatePage } from "./classic-template";
import { getTemplate } from "./template-registry";
import { buildContinuousResumePage } from "./resume-pages";
import { useLocale } from "@/lib/i18n";

// 确保所有渲染器模块被加载并注册（硬刷新时也有效）
import "./blank-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";
import "./section-banner-template";

/** 实时预览面板，将连续简历按不同断点缩放渲染，并用红线标记分页位置 */
export const ResumePreview = memo(function ResumePreview({
  registerPage,
}: {
  registerPage?: (index: number, node: HTMLDivElement | null) => void;
}) {
  const resume = useResumeStore((state) => state.resume);
  const { locale } = useLocale();
  const page = useMemo(() => (resume ? buildContinuousResumePage(resume) : null), [resume]);
  const documentRef = useRef<HTMLDivElement | null>(null);
  const [documentHeight, setDocumentHeight] = useState(1123);
  const [scale, setScale] = useState(0.58);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width <= 560) setScale(0.46);
      else if (width <= 1023) setScale(0.78);
      else if (width >= 1750) setScale(1);
      else if (width >= 1536) setScale(0.78);
      else setScale(0.58);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const node = documentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setDocumentHeight(Math.max(1123, Math.ceil(node.scrollHeight)));
    };
    updateHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [page, resume?.templateId]);

  if (!resume || !page) return null;

  const entry = getTemplate(resume.templateId);
  const Renderer = entry?.component ?? ClassicTemplatePage;
  const pageCount = Math.max(1, Math.ceil(documentHeight / 1123));

  return (
    <div className="min-h-full overflow-auto bg-[#dfe5ec] p-3 sm:p-5 md:p-10">
      <div className="flex min-w-fit justify-center">
        <div
          className="relative shrink-0"
          style={{
            width: 794 * scale,
            height: documentHeight * scale,
          }}
        >
          <div
            className="absolute left-0 top-0 origin-top-left shadow-[0_20px_60px_rgb(30_40_60/20%)]"
            data-testid="continuous-preview"
            style={{ transform: `scale(${scale})` }}
          >
            <Renderer
              page={page}
              pageRef={(node) => {
                documentRef.current = node;
                registerPage?.(0, node);
              }}
              locale={locale}
              resume={resume}
            />
            {Array.from({ length: pageCount - 1 }, (_, index) => {
              const pageNumber = index + 2;
              return (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 w-full border-t-2 border-dashed border-red-500"
                  data-pdf-exclude="true"
                  key={`page-marker-${pageNumber}`}
                  style={{ top: (pageNumber - 1) * 1123 }}
                >
                  <span className="absolute left-3 top-[-11px] bg-red-500 px-2 py-0.5 text-[11px] font-black leading-none text-white">
                    {locale === "en-US" ? `Page ${pageNumber}` : `第${pageNumber}页`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
