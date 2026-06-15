import {
  CalendarDays,
  Globe2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { memo } from "react";
import type {
  ResumeDocument,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import {
  normalizeRichText,
  sanitizeRichText,
} from "@/features/rich-text/rich-text";

export const templateRegistry = {
  classic: {
    id: "classic",
    name: "经典单栏",
    description: "清晰稳重，适合绝大多数求职场景",
  },
} as const;

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
  const basics = resume.modules.find((module) => module.type === "basics")?.basics;
  const fontFamilies = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"Microsoft YaHei", "PingFang SC", sans-serif',
  };

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-hidden bg-white text-[#182235]"
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
        {basics?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-[112px] w-[88px] shrink-0 object-cover ring-1 ring-[#d8dee8]"
            src={basics.avatar}
          />
        ) : (
          <div
            className="grid h-[112px] w-[88px] shrink-0 place-items-center text-white"
            style={{ background: resume.styles.accent }}
          >
            <UserRound size={42} strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <i
              className="block h-14 w-1.5 rounded-full"
              style={{ background: resume.styles.accent }}
            />
            <div>
              <h1 className="text-[34px] font-black tracking-wide">
                {basics?.name || "你的姓名"}
              </h1>
              <p className="mt-1 text-[14px] font-semibold text-[#758196]">
                {basics?.role || "目标职位"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#526079]">
            <Info icon={UserRound} text={basics?.status} />
            <Info icon={CalendarDays} text={basics?.birthday} />
            <Info icon={Mail} text={basics?.email} />
            <Info icon={Phone} text={basics?.phone} />
            <Info icon={MapPin} text={basics?.location} />
            <Info icon={Globe2} text={basics?.website} />
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
        <h2 className="text-[17px] font-black">{module.title}</h2>
      </div>
      <div className="space-y-5">
        {module.items.map((item) => (
          <article className="break-inside-avoid" key={item.id}>
            <div className="flex items-start justify-between gap-5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                {module.type !== "skills" && (
                  <h3 className="font-black">{item.title}</h3>
                )}
                {item.subtitle && (
                  <span className="text-[12px] font-semibold text-[#7b8799]">
                    {item.subtitle}
                  </span>
                )}
              </div>
              {(item.startDate || item.endDate) && (
                <span className="shrink-0 px-2 py-1 text-[10px] font-bold text-black">
                  {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                </span>
              )}
            </div>
            {item.description && (
              <div
                className="rich-text-content resume-rich-text mt-2 text-[12px] text-[#526079]"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(normalizeRichText(item.description)),
                }}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  text,
}: {
  icon: typeof UserRound;
  text?: string;
}) {
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={12} />
      {text}
    </span>
  );
}
