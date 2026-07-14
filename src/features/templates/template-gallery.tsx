"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  PageContainer,
} from "@/components/anime-ui/ui";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "./template-registry";
import { TemplateSelectionCard } from "./template-selection-card";
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
    <PageContainer className="flex h-full flex-col gap-7 overflow-hidden text-white">
      <div className="flex flex-wrap items-end justify-between gap-5 shrink-0">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-white/72">TEMPLATE LIBRARY</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">{t.templates.title}</h1>
          <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/78">{t.templates.subtitle}</p>
        </div>
      </div>

      <div className="scenic-scrollbar flex-1 overflow-y-auto pb-2">
        <div
          className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="template-grid"
        >
          {templateEntries.map((entry, index) => (
            <TemplateSelectionCard
              animationDelay={`${index * 60}ms`}
              entry={entry}
              key={entry.id}
              onSelect={() => applyTemplate(index)}
              testId="template-card"
            />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
