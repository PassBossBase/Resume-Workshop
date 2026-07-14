"use client";

import { StickerCard } from "@/components/anime-ui/ui";
import type { TemplateEntry } from "@/features/templates/template-registry";
import { useLocale } from "@/lib/i18n";
import { TemplateThumbnail } from "./template-thumbnail";

/** 模板库与创建弹窗共用的选择卡片，确保缩略图与固定信息层保持一致。 */
export function TemplateSelectionCard({
  animationDelay,
  entry,
  onSelect,
  testId,
}: {
  animationDelay?: string;
  entry: TemplateEntry;
  onSelect: () => void;
  testId?: string;
}) {
  const { t } = useLocale();

  return (
    <StickerCard
      aria-label={t.templates.useAria(t.templates.names[entry.id])}
      className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden text-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
      data-testid={testId}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      style={animationDelay ? { animationDelay } : undefined}
      tabIndex={0}
      variant="scenic"
    >
      <TemplateThumbnail
        ariaLabel={t.templates.previewAria(t.templates.names[entry.id])}
        className="pointer-events-none h-full"
        templateId={entry.id}
      />

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-white/25 bg-[#063c4d]/76 px-5 py-3 backdrop-blur-xl">
        <h2 className="truncate text-[16px] font-black text-white">
          {t.templates.names[entry.id]}
        </h2>
        <p className="mt-1 truncate text-xs font-medium text-white/90">
          {t.templates.descriptions[entry.id]}
        </p>
      </div>
    </StickerCard>
  );
}
