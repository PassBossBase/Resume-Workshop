/**
 * 「顶部全宽蓝色头部单栏」模板渲染器。
 *
 * 布局结构：
 * 1. 顶部全宽蓝色头部：姓名 + 求职信息行 + 信息网格 + 头像
 * 2. 下方单栏内容区：各模块按序纵向排列
 */
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Lightbulb,
  UserRound,
  Wrench,
} from "lucide-react";
import { memo } from "react";
import type {
  CustomResumeEntry,
  ResumeDocument,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import { getBasicDisplayItems } from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import {
  normalizeRichText,
  sanitizeRichText,
} from "@/features/rich-text/rich-text";
import { BasicInfoValue } from "./basic-info-link";
import { registerTemplate } from "./template-registry";

/** sectionIcon → Lucide 图标映射 */
const ICON_MAP: Record<string, typeof Award> = {
  work: BriefcaseBusiness,
  edu: GraduationCap,
  skill: Wrench,
  cert: Award,
  eval: Lightbulb,
  project: BriefcaseBusiness,
  user: UserRound,
};

function ModuleIcon({
  iconName,
  size = 16,
  style,
}: {
  iconName?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  if (!iconName) return null;
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return null;
  return <IconComponent size={size} style={style} />;
}

/** 顶部全宽蓝色头部单栏模板 */
export const HeaderFullWidthTemplate = memo(function HeaderFullWidthTemplate({
  resume,
  page,
  pageRef,
}: {
  resume: ResumeDocument;
  page: ResumePageData;
  pageRef?: (node: HTMLDivElement | null) => void;
}) {
  const cfg = resume.layoutConfig;
  // layoutConfig 类型守卫
  if (cfg.type !== "single_column_header_full_width") return null;

  const firstModule = resume.modules[0];
  const basics =
    firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getBasicDisplayItems(basics);
  const headerBg = cfg.headerBgColor;
  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-visible bg-white text-[#2d3748]"
      style={{
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
      }}
    >
      {/* ========== 蓝色全宽头部 ========== */}
      {page.showHeader && (
        <header
          className="relative"
          style={{
            background: headerBg,
            color: "#ffffff",
            padding: resume.styles.pageMargin,
            paddingBottom: resume.styles.pageMargin * 0.8,
          }}
        >
          {/* 头像（右上角） */}
          {basics?.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute h-[112px] w-[88px] object-cover"
              src={basics.avatar}
              style={{
                right: resume.styles.pageMargin,
                top: resume.styles.pageMargin,
              }}
            />
          )}

          {basics?.name && (
            <h1 className="text-[2em] font-black" style={{ color: "#ffffff" }}>
              {basics.name}
            </h1>
          )}

          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[0.857em] opacity-90">
            {basicDisplayItems.map((item) => (
              <span key={item.key}>
                {item.label}：<BasicInfoValue item={item} />
              </span>
            ))}
          </div>
        </header>
      )}

      {/* ========== 模块内容区 ========== */}
      <main
        style={{
          background: cfg.contentBgColor,
          display: "grid",
          gap: resume.styles.sectionGap,
          paddingLeft: resume.styles.pageMargin,
          paddingRight: resume.styles.pageMargin,
          paddingTop: page.showHeader
            ? resume.styles.sectionGap
            : resume.styles.pageMargin,
          paddingBottom: resume.styles.sectionGap,
        }}
      >
        {page.modules.map((module) => (
          <HeaderFullWidthSection
            accent={resume.styles.accent}
            key={module.id}
            module={module}
            titleColor={cfg.titleColor}
            textColor={cfg.textColor}
          />
        ))}
      </main>
    </div>
  );
});

// ──────────────────────────────────────
// 模块区块
// ──────────────────────────────────────

function HeaderFullWidthSection({
  module,
  accent,
  titleColor,
  textColor,
}: {
  module: ResumeModule;
  accent: string;
  titleColor: string;
  textColor: string;
}) {
  return (
    <section className="break-inside-avoid">
      {/* 模块标题 */}
      <div
        className="mb-3 flex items-center gap-2 border-b pb-2"
        style={{ borderColor: accent }}
      >
        <ModuleIcon
          iconName={module.sectionIcon}
          size={16}
          style={{ color: accent }}
        />
        <h2 className="text-[1.143em] font-black" style={{ color: titleColor }}>
          {module.title}
        </h2>
      </div>

      {/* 条目列表 */}
      <div className="space-y-4">
        {module.items.map((item) => {
          if ("visible" in item && !(item as CustomResumeEntry).visible)
            return null;
          return (
            <article className="break-inside-avoid" key={item.id}>
              {module.type === "education" ? (
                <div className="grid grid-cols-3 items-start gap-4">
                  <h3 className="font-black" style={{ color: textColor }}>
                    {item.title}
                  </h3>
                  <span className="text-center text-[0.929em] font-medium text-black">
                    {item.subtitle}
                  </span>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 text-right text-[0.857em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {module.type !== "skills" && (
                      <h3 className="font-black" style={{ color: textColor }}>
                        {item.title}
                      </h3>
                    )}
                    {item.subtitle && (
                      <span className="text-[0.929em] font-medium text-black">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 text-[0.857em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              )}
              {item.description && (
                <div
                  className="rich-text-content resume-rich-text mt-2 text-[0.929em] text-black"
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

// 注册
registerTemplate({
  id: "single_column_header_full_width",
  name: "蓝色头部单栏",
  description: "全宽蓝色头部通栏",
  component: HeaderFullWidthTemplate,
});
