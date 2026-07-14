/**
 * 「复古分割线顶部标题单栏」模板渲染器。
 *
 * 布局：顶部双标题+分割线 → 信息网格+头像 → 分段线分隔模块区
 */
import { GraduationCap, BriefcaseBusiness } from "lucide-react";
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

/** 复古分割线模板的连续 A4 文档渲染器。 */
export const LineSeparateTemplate = memo(function LineSeparateTemplate({
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
  if (cfg.type !== "single_column_line_separate") return null;

  const firstModule = resume.modules[0];
  const basics =
    firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getLocalizedBasicDisplayItems(basics, locale);
  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-visible bg-white"
      style={{
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
        color: cfg.textColor,
        padding: `${resume.styles.pageMargin}px`,
      }}
    >
      {/* ======== 顶部标题横条 ======== */}
      {page.showHeader && (
        <header className="mb-0">
          <div className="flex items-center justify-between">
            <div>
              {basics?.name && (
                <h1
                  className="text-[2em] font-black tracking-wide"
                  style={{ color: cfg.titleColor }}
                >
                  {basics.name}
                </h1>
              )}
            </div>
            <div className="flex gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-black">
                <GraduationCap size={18} />
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-black">
                <BriefcaseBusiness size={18} />
              </span>
            </div>
          </div>
          {/* 分割线 - 跟随主题色 */}
          <div
            className="mt-4"
            style={{ height: 3, background: resume.styles.accent }}
          />
        </header>
      )}

      {/* ======== 基础信息网格 + 头像 ======== */}
      {page.showHeader && basics && (
        <div className="relative grid min-h-[128px] content-center grid-cols-2 gap-x-10 gap-y-2 text-[0.929em]">
          {basicDisplayItems.map((item) => (
            <InfoRow item={item} key={item.key} />
          ))}
          {basics.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute right-0 top-1/2 h-[112px] w-[88px] -translate-y-1/2 object-cover"
              src={basics.avatar}
            />
          )}
        </div>
      )}

      {/* ======== 分段线模块区 ======== */}
      <main style={{ display: "grid", gap: resume.styles.sectionGap }}>
        {page.modules
          .filter((m) => m.type !== "basics")
          .map((mod) => (
            <LineSeparateSection
              accent={resume.styles.accent}
              key={mod.id}
              locale={locale}
              module={mod}
              titleColor={cfg.titleColor}
              textColor={cfg.textColor}
              separateColor={resume.styles.accent}
            />
          ))}
      </main>
    </div>
  );
});

/** 复古分割线模板中按“字段名：值”展示的基础信息行。 */
function InfoRow({
  item,
}: {
  item: ReturnType<typeof getLocalizedBasicDisplayItems>[number];
}) {
  return (
    <div className="flex gap-2">
      <BasicInfoLabel className="shrink-0" item={item} />
      <BasicInfoValue item={item} />
    </div>
  );
}

/** 复古分割线模板内使用横线分隔的模块区块。 */
function LineSeparateSection({
  module,
  accent,
  titleColor,
  textColor,
  separateColor,
  locale,
}: {
  module: ResumeModule;
  accent: string;
  titleColor: string;
  textColor: string;
  separateColor: string;
  locale: AppLocale;
}) {
  return (
    <section className="break-inside-avoid">
      {/* 顶部分割线 */}
      <div className="mb-3" style={{ height: 2, background: separateColor }} />

      <div className="mb-2 flex items-center gap-2">
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
              {module.type === "education" ? (
                <div className="grid grid-cols-3 items-start gap-3">
                  <h3
                    className="text-[1em] font-black"
                    style={{ color: textColor }}
                  >
                    {item.title}
                  </h3>
                  <span className="text-center text-[0.857em] text-black">
                    {item.subtitle}
                  </span>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 text-right text-[0.786em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              ) : (
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
                      <span className="text-[0.857em] text-black">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 text-[0.786em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              )}
              {item.description && (
                <div
                  className="rich-text-content resume-rich-text mt-1.5 text-[0.857em] text-black"
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
  id: "single_column_line_separate",
  name: "复古分割线",
  description: "顶部双标题+分段线分隔，清晰稳重",
  component: LineSeparateTemplate,
});
