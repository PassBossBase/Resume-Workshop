"use client";

import { memo, useMemo } from "react";
import { useResumeStore } from "@/stores/resume-store";
import { ClassicTemplatePage } from "./classic-template";
import { getTemplate } from "./template-registry";
import { buildResumePages } from "./resume-pages";

// 确保所有渲染器模块被加载并注册（硬刷新时也有效）
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";

/** 实时预览面板，将分页后的简历按不同断点缩放渲染 */
export const ResumePreview = memo(function ResumePreview({
  registerPage,
}: {
  registerPage?: (index: number, node: HTMLDivElement | null) => void;
}) {
  const resume = useResumeStore((state) => state.resume);
  const pages = useMemo(() => (resume ? buildResumePages(resume) : []), [resume]);
  if (!resume) return null;

  const entry = getTemplate(resume.templateId);
  const Renderer = entry?.component ?? ClassicTemplatePage;

  return (
    <div className="min-h-full overflow-auto bg-[#dfe5ec] p-3 sm:p-5 md:p-10">
      <div className="flex min-w-fit flex-col items-center gap-6">
      {pages.map((page, index) => (
        <div
          className="relative h-[1123px] w-[794px] shrink-0 max-[560px]:h-[517px] max-[560px]:w-[365px] min-[561px]:max-[1023px]:h-[876px] min-[561px]:max-[1023px]:w-[619px] lg:h-[651px] lg:w-[461px] 2xl:h-[876px] 2xl:w-[619px] min-[1750px]:h-[1123px] min-[1750px]:w-[794px]"
          key={`${resume.id}-page-${index}`}
        >
          <div className="absolute left-0 top-0 origin-top-left shadow-[0_20px_60px_rgb(30_40_60/20%)] max-[560px]:scale-[0.46] min-[561px]:max-[1023px]:scale-[0.78] lg:scale-[0.58] 2xl:scale-[0.78] min-[1750px]:scale-100">
            <Renderer
              page={page}
              pageRef={(node) => registerPage?.(index, node)}
              resume={resume}
            />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
});
