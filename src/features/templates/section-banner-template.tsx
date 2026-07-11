/**
 * 「自定义标题背景」模板渲染器。
 *
 * 布局参考用户提供的 PDF：顶部深色个人信息横幅，正文单栏，
 * 模块标题使用主题色整条背景，条目采用内容左侧 + 日期右侧。
 */
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Wrench,
} from "lucide-react";
import { memo } from "react";
import type {
  BasicDisplayItem,
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

const MODULE_ICONS: Record<string, typeof Award> = {
  basics: UserRound,
  skills: Wrench,
  work: BriefcaseBusiness,
  projects: BriefcaseBusiness,
  education: GraduationCap,
  custom: Award,
};

const BASIC_ICONS: Record<string, typeof UserRound> = {
  role: UserRound,
  status: Lightbulb,
  birthday: Award,
  email: Mail,
  phone: Phone,
  location: MapPin,
};

/** 自定义标题背景模板的连续 A4 文档渲染器。 */
export const SectionBannerTemplate = memo(function SectionBannerTemplate({
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
  if (cfg.type !== "single_column_section_banner") return null;

  const firstModule = resume.modules[0];
  const basics =
    firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getLocalizedBasicDisplayItems(basics, locale);
  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };
  const accent = resume.styles.accent;

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-visible bg-white"
      style={{
        color: cfg.textColor,
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
      }}
    >
      {page.showHeader && (
        <header
          className="relative"
          style={{
            background: accent,
            color: cfg.headingTextColor,
            paddingBottom: Math.max(26, resume.styles.pageMargin * 0.72),
            paddingLeft: resume.styles.pageMargin,
            paddingRight: resume.styles.pageMargin,
            paddingTop: resume.styles.pageMargin,
          }}
        >
          <div
            className="min-w-0"
            style={{ maxWidth: basics?.avatar ? 560 : undefined }}
          >
            {basics?.name && (
              <h1 className="text-[2.143em] font-black leading-tight">
                {basics.name}
              </h1>
            )}
            {basics?.role && (
              <p className="mt-2 text-[1em] font-semibold opacity-90">
                {basics.role}
              </p>
            )}
            {basics?.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="absolute h-[108px] w-[84px] object-cover ring-2 ring-white/60"
                src={basics.avatar}
                style={{
                  right: resume.styles.pageMargin,
                  top: resume.styles.pageMargin,
                }}
              />
            )}
          </div>

          {basicDisplayItems.length > 0 && (
            <div
              className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[0.857em] opacity-95"
              style={{ maxWidth: basics?.avatar ? 560 : undefined }}
            >
              {basicDisplayItems.map((item) => (
                <HeaderInfo item={item} key={item.key} />
              ))}
            </div>
          )}
        </header>
      )}

      <main
        style={{
          display: "grid",
          gap: resume.styles.sectionGap,
          paddingBottom: resume.styles.sectionGap,
          paddingLeft: resume.styles.pageMargin,
          paddingRight: resume.styles.pageMargin,
          paddingTop: page.showHeader
            ? resume.styles.sectionGap
            : Math.max(18, resume.styles.pageMargin * 0.6),
        }}
      >
        {page.modules.map((module) => (
          <SectionBannerSection
            accent={accent}
            headingTextColor={cfg.headingTextColor}
            key={module.id}
            locale={locale}
            module={module}
            textColor={cfg.textColor}
          />
        ))}
      </main>
    </div>
  );
});

/** 标题背景模板头部的图标化基础信息项。 */
function HeaderInfo({ item }: { item: BasicDisplayItem }) {
  const Icon = BASIC_ICONS[item.key] ?? UserRound;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon className="shrink-0" size={13} />
      <span className="truncate">
        <BasicInfoLabel item={item} />
        <BasicInfoValue item={item} />
      </span>
    </span>
  );
}

/** 自定义标题背景模板内带色块标题的模块区块。 */
function SectionBannerSection({
  module,
  accent,
  headingTextColor,
  textColor,
  locale,
}: {
  module: ResumeModule;
  accent: string;
  headingTextColor: string;
  textColor: string;
  locale: AppLocale;
}) {
  const Icon = MODULE_ICONS[module.type] ?? Award;

  return (
    <section className="break-inside-avoid">
      <div
        className="mb-4 flex min-h-8 items-center overflow-hidden rounded-[2px] text-[1em] font-black"
        style={{ background: accent, color: headingTextColor }}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center bg-black/10">
          <Icon size={15} />
        </span>
        <h2 className="truncate px-3">
          {getLocalizedModuleTitle(module, locale)}
        </h2>
      </div>

      <div className="space-y-4">
        {module.items.map((item) => {
          if ("visible" in item && !(item as CustomResumeEntry).visible)
            return null;

          const dateText = [item.startDate, item.endDate]
            .filter(Boolean)
            .join(" - ");
          const hasHeading = module.type !== "skills" && Boolean(item.title);

          return (
            <article className="break-inside-avoid" key={item.id}>
              <div className="min-w-0">
                {module.type === "education" ? (
                  <div className="mb-1 grid grid-cols-3 items-start gap-5">
                    <h3
                      className="font-black leading-snug"
                      style={{ color: textColor }}
                    >
                      {item.title}
                    </h3>
                    <span className="text-center text-[0.929em] font-semibold text-[#555555]">
                      {item.subtitle}
                    </span>
                    {dateText && (
                      <span className="shrink-0 pt-0.5 text-right text-[0.857em] font-bold text-[#545454]">
                        {dateText}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mb-1 flex items-start justify-between gap-5">
                    <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {hasHeading && (
                        <h3
                          className="font-black leading-snug"
                          style={{ color: textColor }}
                        >
                          {item.title}
                        </h3>
                      )}
                      {item.subtitle && (
                        <span className="text-[0.929em] font-semibold text-[#555555]">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    {dateText && (
                      <span className="shrink-0 pt-0.5 text-right text-[0.857em] font-bold text-[#545454]">
                        {dateText}
                      </span>
                    )}
                  </div>
                )}

                {item.description && (
                  <div
                    className="rich-text-content resume-rich-text text-[0.929em] text-[#333333]"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichText(
                        normalizeRichText(item.description),
                      ),
                    }}
                  />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

registerTemplate({
  id: "single_column_section_banner",
  name: "自定义标题背景",
  description: "深色信息横幅与标题条",
  component: SectionBannerTemplate,
});
