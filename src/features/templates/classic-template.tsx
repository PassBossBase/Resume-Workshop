import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { memo } from "react";
import type {
  BasicDisplayItem,
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

/** 经典单栏模板元数据 */
export const CLASSIC_TEMPLATE = {
  id: "classic" as const,
  name: "经典单栏",
  description: "清晰稳重，适合绝大多数求职场景",
};

/** 「经典单栏」模板的 A4 页面渲染，包含头像、基本信息、各模块条目 */
export const ClassicTemplatePage = memo(function ClassicTemplatePage({
  resume,
  page,
  pageRef,
}: {
  resume: ResumeDocument;
  page: ResumePageData;
  pageRef?: (node: HTMLDivElement | null) => void;
}) {
  const firstModule = resume.modules[0];
  const basics = firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getBasicDisplayItems(basics);

  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"KaiTi", "STKaiti", "Kaiti SC", serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-visible bg-white text-[#182235]"
      style={{
        padding: resume.styles.pageMargin,
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
      }}
    >
      <div
        className="absolute left-0 top-0 h-2 w-full"
        style={{ background: resume.styles.accent }}
      />
      {page.showHeader && (
      <header className="flex items-start gap-7 border-b border-[#dfe4ec] pb-7 pt-2">
        {basics?.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-[112px] w-[88px] shrink-0 object-cover ring-1 ring-[#d8dee8]"
            src={basics.avatar}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <i
              className="block h-14 w-1.5 rounded-full"
              style={{ background: resume.styles.accent }}
            />
            <div>
              {basics?.name && (
                <h1 className="text-[2.429em] font-black tracking-wide">
                  {basics.name}
                </h1>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.857em] text-[#526079]">
            {basicDisplayItems.map((item) => (
              <Info item={item} key={item.key} />
            ))}
          </div>
        </div>
      </header>
      )}
      <main style={{ display: "grid", gap: resume.styles.sectionGap, paddingTop: page.showHeader ? resume.styles.sectionGap : 8 }}>
        {page.modules.map((module) => (
          <ResumeSection
            accent={resume.styles.accent}
            key={module.id}
            module={module}
          />
        ))}
      </main>
    </div>
  );
});

function ResumeSection({
  module,
  accent,
}: {
  module: ResumeModule;
  accent: string;
}) {
  return (
    <section className="break-inside-avoid">
      <div className="mb-4 flex items-center gap-3 border-b border-[#dfe4ec] pb-2">
        <i className="h-5 w-1.5 rounded-full" style={{ background: accent }} />
        <h2 className="text-[1.214em] font-black">{module.title}</h2>
      </div>
      <div className="space-y-5">
        {module.items.map((item) => {
          // 跳过隐藏的自定义条目
          if ("visible" in item && !(item as CustomResumeEntry).visible) return null;
          return (
            <article className="break-inside-avoid" key={item.id}>
              {module.type === "education" ? (
                <div className="grid grid-cols-3 items-start gap-4">
                  <h3 className="font-black">{item.title}</h3>
                  <span className="text-center text-[0.857em] font-semibold text-black">
                    {item.subtitle}
                  </span>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 px-2 py-1 text-right text-[0.714em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between gap-5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    {module.type !== "skills" && (
                      <h3 className="font-black">{item.title}</h3>
                    )}
                    {item.subtitle && (
                      <span className="text-[0.857em] font-semibold text-black">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {(item.startDate || item.endDate) && (
                    <span className="shrink-0 px-2 py-1 text-[0.714em] font-bold text-black">
                      {[item.startDate, item.endDate]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  )}
                </div>
              )}
              {item.description && (
                <div
                  className="rich-text-content resume-rich-text mt-2 text-[0.857em] text-black"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(normalizeRichText(item.description)),
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

function Info({
  item,
}: {
  item: BasicDisplayItem;
}) {
  const Icon =
    item.key === "birthday"
      ? CalendarDays
      : item.key === "email"
        ? Mail
        : item.key === "phone"
          ? Phone
          : item.key === "location"
            ? MapPin
            : UserRound;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={12} />
      {item.label}：<BasicInfoValue item={item} />
    </span>
  );
}

// 注册到全局模板表
registerTemplate({ ...CLASSIC_TEMPLATE, component: ClassicTemplatePage });
