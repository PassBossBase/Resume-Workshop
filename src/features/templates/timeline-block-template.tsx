/**
 * 「时间轴色块行政单栏」模板渲染器。
 *
 * 布局：顶部标题+头像+简介 → 左侧信息栏+右侧时间轴色块经历
 */
import { memo } from "react";
import type { CustomResumeEntry, ResumeDocument, ResumeModule } from "@/features/resume-model/resume-model";
import { getBasicDisplayItems } from "@/features/resume-model/resume-model";
import type { ResumePageData } from "./resume-pages";
import { normalizeRichText, sanitizeRichText } from "@/features/rich-text/rich-text";
import { registerTemplate } from "./template-registry";

export const TimelineBlockTemplate = memo(function TimelineBlockTemplate({
  resume, page, pageRef,
}: {
  resume: ResumeDocument;
  page: ResumePageData;
  pageRef?: (node: HTMLDivElement | null) => void;
}) {
  const cfg = resume.layoutConfig;
  if (cfg.type !== "single_column_timeline_block") return null;

  const firstModule = resume.modules[0];
  const basics = firstModule?.type === "basics" ? firstModule.basics : undefined;
  const basicDisplayItems = getBasicDisplayItems(basics);
  const fontFamilies: Record<string, string> = {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    serif: '"Songti SC", SimSun, serif',
    rounded: '"Microsoft YaHei", "PingFang SC", sans-serif',
    alibaba: '"Alibaba PuHuiTi", "阿里巴巴普惠体", "Microsoft YaHei", sans-serif',
  };

  const colors = cfg.blockColorList;
  // 右侧时间轴模块：工作经历 + 项目经历，按 page.modules 顺序排列（支持拖拽换位）
  const rightModules = page.modules.filter((m) => m.type === "work" || m.type === "projects");
  const leftModules = page.modules.filter((m) => m.type !== "work" && m.type !== "projects" && m.type !== "basics");

  return (
    <div
      ref={pageRef}
      className="resume-page relative min-h-[1123px] w-[794px] overflow-visible bg-white"
      style={{
        fontFamily: fontFamilies[resume.styles.fontFamily],
        fontSize: resume.styles.fontSize,
        lineHeight: resume.styles.lineHeight,
        color: cfg.textColor,
      }}
    >
      {/* ======== 顶部标题区 ======== */}
      {page.showHeader && (
        <header className="relative px-10 pt-8 pb-4" style={{ background: "#ffffff" }}>
          <div className="flex items-start justify-between">
            <div style={{ maxWidth: 620 }}>
              {basics?.name && (
                <h1 className="text-[26px] font-black" style={{ color: cfg.titleColor }}>
                  {basics.name}
                </h1>
              )}
            </div>
            {basics?.avatar && basics?.avatarPosition && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="shrink-0 object-cover"
                src={basics.avatar}
                style={{
                  width: basics.avatarPosition.width,
                  height: basics.avatarPosition.height,
                }}
              />
            )}
          </div>
        </header>
      )}

      {/* ======== 双栏主体 ======== */}
      <div className="flex px-10">
        {/* 左侧信息栏 */}
        <aside className="shrink-0 pr-6" style={{ width: 320 }}>
          {/* 个人信息组 */}
          {basicDisplayItems.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 text-[14px] font-black" style={{ color: cfg.titleColor }}>个人信息</h3>
              <div className="space-y-1 text-[12px]">
                {basicDisplayItems.map((item) => (
                  <p key={item.key}>{item.label}：{item.value}</p>
                ))}
              </div>
            </section>
          )}

          {leftModules.map((mod) => (
            <TimelineLeftSection
              key={mod.id}
              module={mod}
              titleColor={cfg.titleColor}
              textColor={cfg.textColor}
            />
          ))}
        </aside>

        {/* 右侧时间轴：工作经历 + 项目经历，顺序由模块排列决定 */}
        <div className="flex-1 min-w-0">
          {rightModules.map((mod, modIdx) => {
            if (mod.items.length === 0) return null;
            return (
              <section key={mod.id} className={modIdx > 0 ? "mt-6" : ""}>
                <h3 className="mb-5 text-[14px] font-black" style={{ color: cfg.titleColor }}>
                  {mod.title}
                </h3>
                <div className="relative">
                  {/* 时间轴线条 */}
                  <div
                    className="absolute left-[10px] top-0 h-full"
                    style={{ width: 2, background: cfg.timelineLineColor }}
                  />
                  <div className="space-y-5">
                    {mod.items.map((item, i) => (
                      <div className="relative pl-8 overflow-hidden" key={item.id}>
                        {/* 圆点 */}
                        <span
                          className="absolute left-[4px] top-1.5 block rounded-full border-2 bg-white"
                          style={{
                            width: 14, height: 14,
                            borderColor: cfg.timelineLineColor,
                          }}
                        />
                        {/* 日期 */}
                        {(item.startDate || item.endDate) && (
                          <span className="text-[11px] font-bold opacity-50 wrap-break-word">
                            {[item.startDate, item.endDate].filter(Boolean).join(" - ")}
                          </span>
                        )}
                        {/* 色块卡片 */}
                        <div
                          className="mt-1 rounded-lg px-4 py-3 text-white"
                          style={{ background: item.entryStyle?.bgColor ?? colors[i % colors.length] ?? cfg.titleColor }}
                        >
                          <h4 className="font-black text-[14px] wrap-break-word">{item.title}</h4>
                          {item.subtitle && <p className="text-[12px] opacity-90 wrap-break-word">{item.subtitle}</p>}
                          {item.description && (
                            <div
                              className="mt-2 text-[12px] leading-relaxed opacity-90 wrap-break-word"
                              dangerouslySetInnerHTML={{ __html: sanitizeRichText(normalizeRichText(item.description)) }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {/* 预览区最后一页底部留白，PDF 导出时排除 */}
      <div aria-hidden="true" data-pdf-exclude="true" style={{ height: 20 }} />
    </div>
  );
});

function TimelineLeftSection({
  module, titleColor, textColor,
}: {
  module: ResumeModule; titleColor: string; textColor: string;
}) {
  return (
    <section className="mb-5 break-inside-avoid overflow-hidden">
      <h3 className="mb-2 text-[13px] font-black wrap-break-word" style={{ color: titleColor }}>
        {module.title}
      </h3>

      {module.items.map((item) => {
        if ("visible" in item && !(item as CustomResumeEntry).visible) return null;
        return (
          <div className="mb-2 text-[12px] overflow-hidden" key={item.id} style={{ color: textColor }}>
            {(item.startDate || item.endDate) && (
              <span className="font-bold opacity-50 wrap-break-word">
                {[item.startDate, item.endDate].filter(Boolean).join(" ~ ")}
              </span>
            )}
            {item.title && module.type !== "skills" && (
              <p className="font-bold mt-0.5 wrap-break-word">{item.title}</p>
            )}
            {item.subtitle && <p className="opacity-60 wrap-break-word">{item.subtitle}</p>}
            {item.description && (
              <div
                className="mt-1 opacity-75 wrap-break-word"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(normalizeRichText(item.description)) }}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

registerTemplate({
  id: "single_column_timeline_block",
  name: "时间轴色块",
  description: "左侧信息栏+右侧时间轴色块工作与项目经历，适合行政/管理岗位",
  component: TimelineBlockTemplate,
});
