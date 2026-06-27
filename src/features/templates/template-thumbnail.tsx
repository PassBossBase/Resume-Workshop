"use client";

import type { TemplateId } from "@/features/resume-model/resume-model";
import { TemplateSkeletonPreview } from "./template-skeleton-preview";

/**
 * Lightweight template thumbnail for template-selection surfaces.
 * It avoids mounting full resume template renderers inside cards and modals.
 */
export function TemplateThumbnail({
  templateId,
  ariaLabel,
}: {
  templateId: TemplateId;
  ariaLabel?: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="grid h-84 place-items-center overflow-hidden bg-[#e7ebf1] p-2"
    >
      <TemplateSkeletonPreview
        ariaLabel={ariaLabel}
        className="h-full w-56"
        templateId={templateId}
      />
    </div>
  );
}
