/**
 * 「左侧侧边栏深色双栏」模板渲染器。
 *
 * 布局：左侧深色侧边栏（头像+信息）+ 右侧主体内容区
 */
import { memo } from "react";
import type { CustomResumeEntry, ResumeDocument, ResumeModule } from "@/features/resume-model/resume-model";
import { getBasicDisplayItems } from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import { normalizeRichText, sanitizeRichText } from "@/features/rich-text/rich-text";
import { registerTemplate } from "./template-registry";

export const SidebarLeftTemplate = memo(function SidebarLeftTemplate({
  resume, page, pageRef,
}: {
  resume: ResumeDocument;
  page: ResumePageData;
  pageRef?: (node: HTMLDivElement | null) => void;
}) {
  const cfg = resume.layoutConfig;
  if (cfg.type !== "two_column_sidebar_left") return null;

  const firstModule = resume.modules[0];
  const basics = firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getBasicDisplayItems(basics);
  const sidebarModules = page.modules.filter((module) => module.type === "education");
  const mainModules = page.modules.filter(
    (module) => module.type !== "basics" && module.type !== "education",
  );
  const sidebarBg = cfg.sidebarBgColor;
  const sidebarW = cfg.sidebarWidth;
  const fontFamilies = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"Microsoft YaHei", "PingFang SC", sans-serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative flex min-h-[1123px] w-[794px] overflow-hidden"
      style={{
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
      }}
    >
      <aside
        className="shrink-0 px-5 pt-8 pb-6 text-[12px]"
        style={{ width: sidebarW, background: sidebarBg, color: cfg.sidebarTextColor }}
      >
        {basics?.avatar && basics?.avatarPosition && (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="object-cover"
              src={basics.avatar}
              style={{
                width: basics.avatarPosition.width,
                height: basics.avatarPosition.height,
              }}
            />
          </div>
        )}

        {basicDisplayItems.length > 0 && (
          <div className="mb-5 space-y-2">
            {basicDisplayItems.map((item) => (
              <div className="flex gap-2" key={item.key}>
                <span className="opacity-70">{item.label}：</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-5">
          {sidebarModules.map((mod) => (
            <SidebarSection
              accent={cfg.sidebarTextColor}
              key={mod.id}
              module={mod}
              titleColor={cfg.sidebarTextColor}
              textColor={cfg.sidebarTextColor}
            />
          ))}
        </div>
      </aside>

      <main className="flex-1 px-8 py-8" style={{ background: cfg.contentBgColor }}>
        {page.showHeader && (
          <header className="mb-6 border-b pb-5" style={{ borderColor: resume.styles.accent }}>
            <h1 className="text-[26px] font-black" style={{ color: cfg.titleColor }}>
              个人简历
            </h1>
          </header>
        )}

        <div style={{ display: "grid", gap: resume.styles.sectionGap }}>
          {mainModules.map((mod) => (
            <SidebarSection
              accent={resume.styles.accent}
              key={mod.id}
              module={mod}
              titleColor={cfg.titleColor}
              textColor={cfg.textColor}
            />
          ))}
        </div>
      </main>
    </div>
  );
});

function SidebarSection({
  module, accent, titleColor, textColor,
}: {
  module: ResumeModule; accent: string; titleColor: string; textColor: string;
}) {
  return (
    <section className="break-inside-avoid">
      <div className="mb-3 flex items-center gap-2 border-b pb-1.5" style={{ borderColor: accent }}>
        <i className="h-3.5 w-1 rounded-full" style={{ background: accent }} />
        <h2 className="text-[15px] font-black" style={{ color: titleColor }}>{module.title}</h2>
      </div>

      <div className="space-y-4">
        {module.items.map((item) => {
          if ("visible" in item && !(item as CustomResumeEntry).visible) return null;
          return (
            <article className="break-inside-avoid" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  {module.type !== "skills" && <h3 className="font-black text-[14px]" style={{ color: textColor }}>{item.title}</h3>}
                  {item.subtitle && <span className="text-[12px] opacity-60">{item.subtitle}</span>}
                </div>
                {(item.startDate || item.endDate) && (
                  <span className="shrink-0 text-[11px] font-bold opacity-50">
                    {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                  </span>
                )}
              </div>
              {item.description && (
                <div
                  className="rich-text-content resume-rich-text mt-1.5 text-[12px] opacity-75"
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(normalizeRichText(item.description)) }}
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

registerTemplate({
  id: "two_column_sidebar_left",
  name: "深色侧边栏双栏",
  description: "左侧深色侧边栏+右侧主体，适合应届生/实习生",
  component: SidebarLeftTemplate,
});
