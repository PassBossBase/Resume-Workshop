"use client";

import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { ClassicTemplatePage } from "./classic-template";
import type { ResumePageData } from "./resume-pages";

/**
 * 简历卡片的通用缩略图预览区域。
 * 固定高度、可滚动容器，内部居中放置缩放后的模板页面。
 */
export function TemplateThumbnail({
  page,
  resume,
  ariaLabel,
}: {
  page: ResumePageData;
  resume: ResumeDocument;
  ariaLabel?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="relative h-64 overflow-y-auto scrollbar-none border-b-2 border-black bg-[#e7ebf1]"
    >
      <div className="template-thumbnail-page absolute left-1/2 top-4 -translate-x-1/2 shadow-[0_16px_35px_rgb(30_40_60/24%)]">
        <div>
          <ClassicTemplatePage page={page} resume={resume} />
        </div>
      </div>
    </div>
  );
}
