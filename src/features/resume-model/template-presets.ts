/**
 * 内置模板预设。
 *
 * 所有模板的默认内容以基础模板为源头，只叠加各自的模板 ID、布局配置与样式。
 * 这样新建不同模板时，姓名、联系方式、经历、项目、教育等预设信息保持一致。
 */
import {
  createBlankResume,
  type LayoutConfig,
  type ResumeDocument,
  type TemplateId,
} from "@/features/resume-model/resume-model";

type ResumeStyles = ResumeDocument["styles"];

function createTemplateFromBlank(
  title: string,
  templateId: TemplateId,
  layoutConfig: LayoutConfig,
  styles: ResumeStyles,
): ResumeDocument {
  const resume = createBlankResume(crypto.randomUUID(), title);

  return {
    ...resume,
    templateId,
    layoutConfig,
    styles,
  };
}

export function createClassicTemplate(): ResumeDocument {
  return createTemplateFromBlank(
    "经典单栏简历",
    "classic",
    { type: "classic" },
    {
      accent: "#3f57e8",
      fontFamily: "sans",
      fontSize: 15,
      lineHeight: 1.55,
      pageMargin: 36,
      sectionGap: 28,
    },
  );
}

export function createHeaderFullWidthTemplate(): ResumeDocument {
  return createTemplateFromBlank(
    "顶部全宽蓝色头部单栏简历",
    "single_column_header_full_width",
    {
      type: "single_column_header_full_width",
      headerBgColor: "#2b6cb0",
      contentBgColor: "#ffffff",
      titleColor: "#1a365d",
      textColor: "#2d3748",
      accentColor: "#3182ce",
    },
    {
      accent: "#3182ce",
      fontFamily: "sans",
      fontSize: 14,
      lineHeight: 1.6,
      pageMargin: 40,
      sectionGap: 28,
    },
  );
}

export function createSidebarLeftTemplate(): ResumeDocument {
  return createTemplateFromBlank(
    "左侧侧边栏深色双栏简历",
    "two_column_sidebar_left",
    {
      type: "two_column_sidebar_left",
      sidebarBgColor: "#23395d",
      sidebarWidth: 260,
      sidebarTextColor: "#ffffff",
      contentBgColor: "#ffffff",
      titleColor: "#23395d",
      textColor: "#333333",
    },
    {
      accent: "#23395d",
      fontFamily: "sans",
      fontSize: 13,
      lineHeight: 1.55,
      pageMargin: 32,
      sectionGap: 24,
    },
  );
}

export function createTimelineBlockTemplate(): ResumeDocument {
  return createTemplateFromBlank(
    "时间轴色块行政单栏简历",
    "single_column_timeline_block",
    {
      type: "single_column_timeline_block",
      titleColor: "#2b6cb0",
      timelineLineColor: "#94b8e0",
      blockColorList: ["#4a90e2", "#60b8a8", "#d87890", "#90c978"],
      textColor: "#222222",
    },
    {
      accent: "#4a90e2",
      fontFamily: "sans",
      fontSize: 13,
      lineHeight: 1.5,
      pageMargin: 36,
      sectionGap: 24,
    },
  );
}

export function createLineSeparateTemplate(): ResumeDocument {
  return createTemplateFromBlank(
    "复古分割线顶部标题单栏简历",
    "single_column_line_separate",
    {
      type: "single_column_line_separate",
      headerLineColor: "#6b8ba4",
      sectionSeparateLineColor: "#334155",
      titleColor: "#223344",
      textColor: "#333333",
    },
    {
      accent: "#223344",
      fontFamily: "serif",
      fontSize: 14,
      lineHeight: 1.65,
      pageMargin: 40,
      sectionGap: 30,
    },
  );
}

export const builtinTemplateFactories: Record<string, () => ResumeDocument> = {
  blank: () => createBlankResume(crypto.randomUUID(), "基础简历"),
  classic: createClassicTemplate,
  single_column_header_full_width: createHeaderFullWidthTemplate,
  two_column_sidebar_left: createSidebarLeftTemplate,
  single_column_timeline_block: createTimelineBlockTemplate,
  single_column_line_separate: createLineSeparateTemplate,
};
