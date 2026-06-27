"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageContainer, PageHeading } from "@/components/anime-ui/ui";
import { builtinTemplateFactories } from "@/features/resume-model/template-presets";
import { saveResume } from "@/features/storage/resume-repository";
import { listTemplates } from "./template-registry";
import { TemplateThumbnail } from "./template-thumbnail";

// 确保所有渲染器模块被加载并注册
import "./blank-template";
import "./classic-template";
import "./header-full-width-template";
import "./sidebar-left-template";
import "./timeline-block-template";
import "./line-separate-template";

/** 模板选择页：展示可用模板，点击卡片即可使用模板创建简历 */
export function TemplateGallery() {
  const router = useRouter();
  // 从注册表获取全部模板
  const templateEntries = useMemo(() => listTemplates(), []);

  const applyTemplate = async (index: number) => {
    const entry = templateEntries[index];
    const factory = entry ? builtinTemplateFactories[entry.id] : undefined;
    if (!factory) return;
    const resume = factory();
    // 生成新的 ID 和时间戳，作为一份全新的简历
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResume = { ...resume, id, createdAt: now, updatedAt: now };
    await saveResume(newResume);
    router.push(`/resume/${id}`);
  };

  return (
    <PageContainer className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-5 shrink-0">
        <div>
          <PageHeading
            badge="TEMPLATE CLUB"
            badgeColor="bg-(--pink)"
            badgeTextColor="text-white"
            badgeRotation="-rotate-1"
            title="简历模板"
            subtitle="选择一套模板作为起点，快速生成你的简历。"
          />
        </div>
        {/* <InkButton variant="paper">
          <Plus size={18} />
          添加模板
        </InkButton> */}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="mt-8 grid gap-7 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="template-grid"
        >
        {templateEntries.map((entry, index) => {
          return (
            <div
              className="group relative animate-pop cursor-pointer overflow-hidden rounded-[26px] border-2 transition"
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
              tabIndex={0}
            >
              <TemplateThumbnail
                ariaLabel={`${entry.name}模板骨架预览`}
                templateId={entry.id}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-center">
                <h2 className="text-[16px] p-2 font-black bg-white border-t-2">
                  {entry.name}
                </h2>
              </div>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-white px-5 py-2 text-sm font-black text-black">
                  使用模板
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </PageContainer>
  );
}
