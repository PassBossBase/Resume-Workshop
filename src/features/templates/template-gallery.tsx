"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  PageContainer,
  PageHeading,
  StickerCard,
} from "@/components/anime-ui/ui";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "./template-registry";
import { TemplateThumbnail } from "./template-thumbnail";
import { useLocale } from "@/lib/i18n";

// 确保所有渲染器模块被加载并注册
import "./blank-template";
import "./classic-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";
import "./section-banner-template";

/** 模板选择页：展示可用模板，点击卡片即可使用模板创建简历 */
export function TemplateGallery() {
  const router = useRouter();
  const { locale, t } = useLocale();
  // 从注册表获取全部模板
  const templateEntries = useMemo(() => listTemplates(), []);

  const applyTemplate = async (index: number) => {
    const entry = templateEntries[index];
    const factory = entry ? builtinTemplateFactories[entry.id] : undefined;
    if (!factory) return;
    const resume = factory(locale);
    // 生成新的 ID 和时间戳，作为一份全新的简历
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResume = { ...resume, id, createdAt: now, updatedAt: now };
    await saveResume(newResume);
    router.push(`/resume/${id}`);
  };

  return (
    <PageContainer className="flex h-full flex-col overflow-hidden gap-4">
      <div className="flex flex-wrap items-end justify-between gap-5 shrink-0">
        <div>
          <PageHeading
            badge="TEMPLATE CLUB"
            badgeColor="bg-(--pink)"
            badgeTextColor="text-white"
            badgeRotation="-rotate-1"
            title={t.templates.title}
            subtitle={t.templates.subtitle}
          />
        </div>
      </div>

      <div className="comic-card-scrollbar flex-1 overflow-y-auto">
        <div
          className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="template-grid"
        >
          {templateEntries.map((entry, index) => (
            <StickerCard
              aria-label={t.templates.useAria(t.templates.names[entry.id])}
              className="group/card relative h-84 animate-pop cursor-pointer overflow-hidden border-0 bg-[#242528] text-white shadow-none hover:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--blue)"
              data-testid="template-card"
              key={entry.id}
              onClick={() => applyTemplate(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  applyTemplate(index);
                }
              }}
              role="button"
              style={{ animationDelay: `${index * 60}ms` }}
              tabIndex={0}
            >
              <TemplateThumbnail
                ariaLabel={t.templates.previewAria(t.templates.names[entry.id])}
                className="pointer-events-none h-full"
                templateId={entry.id}
              />

              <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-10 bg-[rgba(59,59,203,0.92)] px-5 py-3 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
                <h2 className="truncate text-[16px] font-black text-white">
                  {t.templates.names[entry.id]}
                </h2>
                <p className="mt-1 truncate text-xs font-medium text-white/90">
                  {t.templates.descriptions[entry.id]}
                </p>
              </div>
            </StickerCard>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
