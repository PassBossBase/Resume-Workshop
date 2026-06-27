"use client";

import { clsx } from "clsx";
import type { TemplateId } from "@/features/resume-model/resume-model";
import { TemplateSkeletonPreview } from "./template-skeleton-preview";

/**
 * Lightweight template thumbnail for template-selection surfaces.
 * It avoids mounting full resume template renderers inside cards and modals.
 */
export function TemplateThumbnail({
  templateId,
  ariaLabel,
  className,
}: {
  templateId: TemplateId;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={clsx("relative h-84 overflow-hidden bg-white", className)}
    >
      <TemplateSkeletonPreview
        ariaLabel={ariaLabel}
        className="w-full"
        templateId={templateId}
      />
    </div>
  );
}
