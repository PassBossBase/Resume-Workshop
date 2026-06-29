"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useRef, useState } from "react";
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
import "./section-banner-template";

/**
 * Real resume content thumbnail for the dashboard resume list.
 * Template selection surfaces use TemplateThumbnail's static skeleton instead.
 */
export function ResumeContentThumbnail({
  page,
  resume,
  ariaLabel,
  className,
  fitToWidth = false,
  thumbnailClassName,
}: {
  page: ResumePageData;
  resume: ResumeDocument;
  ariaLabel?: string;
  className?: string;
  fitToWidth?: boolean;
  thumbnailClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(0.4);
  const entry = getTemplate(resume.templateId);
  const Renderer = entry?.component ?? ClassicTemplatePage;

  useLayoutEffect(() => {
    if (!fitToWidth || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      setFitScale(containerRef.current.clientWidth / 794);
    };
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitToWidth]);

  if (fitToWidth) {
    return (
      <div
        aria-label={ariaLabel}
        className={clsx(
          "relative aspect-[794/1123] overflow-hidden bg-white",
          className,
        )}
        ref={containerRef}
      >
        <div
          className={clsx(
            "absolute left-0 top-0 h-[1123px] w-[794px]",
            thumbnailClassName,
          )}
          style={{
            transform: `scale(${fitScale})`,
            transformOrigin: "left top",
          }}
        >
          <Renderer page={page} resume={resume} />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={clsx(
        "relative h-64 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#e7ebf1]",
        className,
      )}
    >
      <div
        className={clsx(
          "template-thumbnail-page absolute left-1/2 top-4 -translate-x-1/2 shadow-[0_16px_35px_rgb(30_40_60/24%)]",
          thumbnailClassName,
        )}
      >
        <div>
          <Renderer page={page} resume={resume} />
        </div>
      </div>
    </div>
  );
}
