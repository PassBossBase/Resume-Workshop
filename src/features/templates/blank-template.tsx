/**
 * 「基础模板」渲染器。
 *
 * 布局：居中对齐头部 → 水平分割线划分模块 →
 * 工作经验/项目经历两列表头 → 教育经历三列表头 → 专业技能纯文本
 */
import {
  Briefcase,
  Cake,
  Globe,
  Mail,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";
import { memo, type ReactElement } from "react";
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

/** basicDisplayItems key → Lucide 图标映射 */
const CONTACT_ICON_MAP: Record<string, typeof Briefcase> = {
  role: Briefcase,
  status: UserCheck,
  birthday: Cake,
  email: Mail,
  phone: Phone,
  location: MapPin,
  website: Globe,
};

/** 联系方式图标，未匹配到 key 时回退 */
function ContactIcon({ itemKey }: { itemKey: string }) {
  const Icon = CONTACT_ICON_MAP[itemKey] ?? Globe;
  return <Icon size={13} />;
}

/** 基础模板的连续 A4 文档渲染器，使用居中头部和分割线组织内容。 */
export const BlankTemplate = memo(function BlankTemplate({
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
  if (cfg.type !== "blank") return null;

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
      {/* ======== 居中对齐头部 ======== */}
      {page.showHeader && (
        <header className="mb-6 text-center">
          {basics?.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="mx-auto mb-3 h-24 w-24 rounded-full object-cover"
              src={basics.avatar}
            />
          )}
          {basics?.name && (
            <h1
              className="text-[2em] font-black tracking-wide"
              style={{ color: "#171717" }}
            >
              {basics.name}
            </h1>
          )}
          {basics?.role && (
            <p
              className="mt-1 text-[1.071em] font-bold"
              style={{ color: "#171717" }}
            >
              {basics.role}
            </p>
          )}
          {basicDisplayItems.length > 0 && (
            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[0.857em]"
              style={{ color: "#171717" }}
            >
              {basicDisplayItems
                .filter((item) => item.key !== "role")
                .map((item) => (
                  <span
                    className="inline-flex items-center gap-1"
                    key={item.key}
                  >
                    <ContactIcon itemKey={item.key} />
                    <BasicInfoLabel item={item} />
                    <BasicInfoValue item={item} />
                  </span>
                ))}
            </div>
          )}
        </header>
      )}

      {/* ======== 模块区（水平分割线分隔） ======== */}
      <main style={{ display: "grid", gap: resume.styles.sectionGap }}>
        {page.modules
          .filter((m) => m.type !== "basics")
          .map((mod) => (
            <BlankSection
              accent={resume.styles.accent}
              key={mod.id}
              module={mod}
              separatorColor={cfg.separatorColor}
              textColor={cfg.textColor}
              titleColor={cfg.titleColor}
              locale={locale}
            />
          ))}
      </main>
    </div>
  );
});

/** 单个模块区块 */
function BlankSection({
  module,
  accent,
  separatorColor,
  titleColor,
  textColor,
  locale,
}: {
  module: ResumeModule;
  accent: string;
  separatorColor: string;
  titleColor: string;
  textColor: string;
  locale: AppLocale;
}) {
  const moduleType = module.type;

  return (
    <section className="break-inside-avoid">
      {/* 顶部分割线 */}
      <div className="mb-3" style={{ height: 1, background: separatorColor }} />

      {/* 模块标题 */}
      <div className="mb-3 flex items-center gap-2">
        <i className="h-3.5 w-1 rounded-full" style={{ background: accent }} />
        <h2 className="text-[1.071em] font-black" style={{ color: titleColor }}>
          {getLocalizedModuleTitle(module, locale)}
        </h2>
      </div>

      {/* 条目列表 */}
      <div className="space-y-4">
        {module.items.map((item) => {
          if ("visible" in item && !(item as CustomResumeEntry).visible)
            return null;

          return (
            <BlankItem
              key={item.id}
              item={item}
              moduleType={moduleType}
              textColor={textColor}
            />
          );
        })}
      </div>
    </section>
  );
}

/** 单个条目 */
function BlankItem({
  item,
  moduleType,
  textColor,
}: {
  item: ResumeModule["items"][number];
  moduleType: string;
  textColor: string;
}) {
  const dateText = [item.startDate, item.endDate].filter(Boolean).join(" - ");

  return (
    <article className="break-inside-avoid">
      {/* 表头行：根据模块类型使用不同列布局 */}
      <ItemHeader
        dateText={dateText}
        itemSubtitle={item.subtitle}
        itemTitle={item.title}
        moduleType={moduleType}
        textColor={textColor}
      />

      {/* 描述段落 */}
      {item.description && (
        <div
          className="rich-text-content resume-rich-text mt-1.5 text-[0.857em] text-black"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(normalizeRichText(item.description)),
          }}
        />
      )}
    </article>
  );
}

/** 条目表头行 —— 根据模块类型切换布局 */
function ItemHeader({
  moduleType,
  itemTitle,
  itemSubtitle,
  dateText,
  textColor,
}: {
  moduleType: string;
  itemTitle: string;
  itemSubtitle: string;
  dateText: string;
  textColor: string;
}) {
  // 专业技能：不显示标题行
  if (moduleType === "skills") return null;

  // 教育经历：三列布局（学校 左 | 专业·学历 中 | 时间 右）
  if (moduleType === "education") {
    return (
      <div
        className="grid grid-cols-3 items-center gap-3"
        style={{ color: textColor }}
      >
        <h3 className="text-[1em] font-black text-left">
          {itemTitle || <NoData />}
        </h3>
        <span className="text-[0.857em] text-center text-black">
          {itemSubtitle || <NoData />}
        </span>
        <span className="shrink-0 text-right text-[0.786em] font-bold text-black">
          {dateText || <NoData />}
        </span>
      </div>
    );
  }

  // 工作经验 / 项目经历 / 自定义模块：两列布局（标题+副标题 左 | 时间 右）
  return (
    <div
      className="flex items-start justify-between gap-3"
      style={{ color: textColor }}
    >
      <div>
        <h3 className="text-[1em] font-black">{itemTitle || <NoData />}</h3>
        {itemSubtitle && (
          <span className="text-[0.857em] text-black">{itemSubtitle}</span>
        )}
      </div>
      {dateText && (
        <span className="shrink-0 text-[0.786em] font-bold text-black">
          {dateText}
        </span>
      )}
    </div>
  );
}

/** 空数据占位符（仅用于预览，实际简历中这些字段可能为空） */
function NoData(): ReactElement {
  return <span className="inline-block h-3 w-12 rounded bg-black/10" />;
}

registerTemplate({
  id: "blank",
  name: "基础模板",
  description: "水平分割线划分模块，简洁清晰，从零开始自由填写",
  component: BlankTemplate,
});
