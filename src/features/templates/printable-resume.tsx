"use client";

import type { ResumeDocument } from "@/features/resume-model/resume-model";
import { useLocale } from "@/lib/i18n";
import { ClassicTemplatePage } from "./classic-template";
import { buildContinuousResumePage } from "./resume-pages";
import { getTemplate } from "./template-registry";

// 打印专用文档渲染时也要完整注册所有模板。
import "./blank-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";
import "./section-banner-template";

/** 浏览器打印引擎使用的未缩放文档，与预览和视觉版导出共用模板渲染器。 */
export function PrintableResume({ resume }: { resume: ResumeDocument }) {
  const { locale } = useLocale();
  const page = buildContinuousResumePage(resume);
  const entry = getTemplate(resume.templateId);
  const Renderer = entry?.component ?? ClassicTemplatePage;

  return (
    <div className="resume-print-root" data-testid="print-resume">
      <Renderer locale={locale} page={page} resume={resume} />
    </div>
  );
}
