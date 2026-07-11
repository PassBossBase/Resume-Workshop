/**
 * 「左侧侧边栏深色双栏」模板渲染器。
 *
 * 布局：左侧深色侧边栏（头像+信息）+ 右侧主体内容区
 */
import { memo } from "react";
import type {
  CustomResumeEntry,
  ResumeDocument,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import {
  normalizeRichText,
  sanitizeRichText,
} from "@/features/rich-text/rich-text";
import { BasicInfoLabel, BasicInfoValue } from "./basic-info-link";
import { registerTemplate } from "./template-registry";
import {
  getLocalizedBasicDisplayItems,
  getLocalizedModuleTitle,
} from "./resume-display";
import type { AppLocale } from "@/lib/locale";

/** 深色侧栏双栏模板的连续 A4 文档渲染器。 */
export const SidebarLeftTemplate = memo(function SidebarLeftTemplate({
  resume,
  page,
  locale = "zh-CN",
  pageRef,
}: {
  resume: ResumeDocument;
  page: ResumePageData;
  locale?: AppLocale;
  pageRef?: (node: HTMLDivElement | null) => void;
}) {
  const cfg = resume.layoutConfig;
  if (cfg.type !== "two_column_sidebar_left") return null;

  const firstModule = resume.modules[0];
  const basics =
    firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getLocalizedBasicDisplayItems(basics, locale);
  const sidebarModules = page.modules.filter(
    (module) => module.type === "education",
  );
  const mainModules = page.modules.filter(
    (module) => module.type !== "basics" && module.type !== "education",
  );
  const sidebarBg = cfg.sidebarBgColor;
  const sidebarW = cfg.sidebarWidth;
  const pageMargin = resume.styles.pageMargin;
  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative flex min-h-[1123px] w-[794px] overflow-visible"
      style={{
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
      }}
    >
      <aside
        className="shrink-0 text-[0.857em]"
        style={{
          width: sidebarW,
          background: sidebarBg,
          color: cfg.sidebarTextColor,
          padding: `${pageMargin}px ${Math.max(20, pageMargin * 0.65)}px`,
        }}
      >
        {basics?.avatar && (
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-20 w-20 rounded-full object-cover"
              src={basics.avatar}
            />
          </div>
        )}

        {basicDisplayItems.length > 0 && (
          <div className="mb-5 space-y-2">
            {basicDisplayItems.map((item) => (
              <div className="flex gap-2" key={item.key}>
                <BasicInfoLabel className="shrink-0" item={item} />
                <BasicInfoValue item={item} />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-5">
          {sidebarModules.map((mod) => (
            <SidebarSection
              accent={cfg.sidebarTextColor}
              key={mod.id}
              locale={locale}
              module={mod}
              titleColor={cfg.sidebarTextColor}
              textColor={cfg.sidebarTextColor}
            />
          ))}
        </div>
      </aside>

      <main
        className="flex-1"
        style={{ background: cfg.contentBgColor, padding: pageMargin }}
      >
        {page.showHeader && (
          <header
            className="mb-6 border-b pb-5"
            style={{ borderColor: resume.styles.accent }}
          >
            {basics?.name && (
              <h1
                className="text-[1.857em] font-black"
                style={{ color: cfg.titleColor }}
              >
                {basics.name}
              </h1>
            )}
          </header>
        )}

        <div style={{ display: "grid", gap: resume.styles.sectionGap }}>
          {mainModules.map((mod) => (
            <SidebarSection
              accent={resume.styles.accent}
              key={mod.id}
              locale={locale}
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

/** 双栏模板左右栏共用的模块标题与条目渲染区块。 */
function SidebarSection({
  module,
  accent,
  titleColor,
  textColor,
  locale,
}: {
  module: ResumeModule;
  accent: string;
  titleColor: string;
  textColor: string;
  locale: AppLocale;
}) {
  return (
    <section className="break-inside-avoid">
      <div
        className="mb-3 flex items-center gap-2 border-b pb-1.5"
        style={{ borderColor: accent }}
      >
        <i className="h-3.5 w-1 rounded-full" style={{ background: accent }} />
        <h2 className="text-[1.071em] font-black" style={{ color: titleColor }}>
          {getLocalizedModuleTitle(module, locale)}
        </h2>
      </div>

      <div className="space-y-4">
        {module.items.map((item) => {
          if ("visible" in item && !(item as CustomResumeEntry).visible)
            return null;
          return (
            <article className="break-inside-avoid" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  {module.type !== "skills" && (
                    <h3
                      className="font-black text-[1em]"
                      style={{ color: textColor }}
                    >
                      {item.title}
                    </h3>
                  )}
                  {item.subtitle && (
                    <span
                      className="text-[0.857em]"
                      style={{ color: textColor }}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </div>
                {(item.startDate || item.endDate) && (
                  <span
                    className="shrink-0 text-[0.786em] font-bold"
                    style={{ color: textColor }}
                  >
                    {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                  </span>
                )}
              </div>
              {item.description && (
                <div
                  className="rich-text-content resume-rich-text mt-1.5 text-[0.857em]"
                  style={{ color: textColor }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(
                      normalizeRichText(item.description),
                    ),
                  }}
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
  description: "左侧深色侧边栏+右侧主体",
  component: SidebarLeftTemplate,
});
