"use client";

import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { ClassicTemplatePage } from "./classic-template";
import { getTemplate } from "./template-registry";
import type { ResumePageData } from "./resume-pages";

// Ensure all template renderers are registered for real resume content previews.
import "./blank-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";

/**
 * Real resume content thumbnail for the dashboard resume list.
 * Template selection surfaces use TemplateThumbnail's static skeleton instead.
 */
export function ResumeContentThumbnail({
  page,
  resume,
  ariaLabel,
}: {
  page: ResumePageData;
  resume: ResumeDocument;
  ariaLabel?: string;
}) {
  const entry = getTemplate(resume.templateId);
  const Renderer = entry?.component ?? ClassicTemplatePage;

  return (
    <div
      aria-label={ariaLabel}
      className="relative h-64 overflow-y-auto scrollbar-none border-b-2 border-black bg-[#e7ebf1]"
    >
      <div className="template-thumbnail-page absolute left-1/2 top-4 -translate-x-1/2 shadow-[0_16px_35px_rgb(30_40_60/24%)]">
        <div>
          <Renderer page={page} resume={resume} />
        </div>
      </div>
    </div>
  );
}
