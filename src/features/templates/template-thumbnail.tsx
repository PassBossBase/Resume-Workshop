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
      className="grid h-64 place-items-center overflow-hidden border-b-2 border-black bg-[#e7ebf1] p-4"
    >
      <TemplateSkeletonPreview
        ariaLabel={ariaLabel}
        className="h-full w-[158px] shadow-[4px_4px_0_black]"
        templateId={templateId}
      />
    </div>
  );
}
