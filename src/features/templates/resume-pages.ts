import type {
  CustomResumeEntry,
  ResumeDocument,
  ResumeEntry,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import { richTextToPlainText } from "@/features/rich-text/rich-text";

export interface ResumePageData {
  showHeader: boolean;
  modules: ResumeModule[];
}

/** 条目基本字段，ResumeEntry 和 CustomResumeEntry 均满足 */
type EntryLike = {
  id: string;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  description: string;
};

const FIRST_PAGE_BUDGET = 760;
const FOLLOWING_PAGE_BUDGET = 1015;
const MODULE_HEADING_HEIGHT = 48;

function estimateEntryHeight(entry: EntryLike): number {
  const lines = richTextToPlainText(entry.description)
    .split("\n")
    .filter(Boolean).length;
  return 58 + Math.max(lines, 1) * 21;
}

/** 判断条目是否可见：固定条目始终可见，自定义条目检查 visible 字段 */
function isEntryVisible(entry: ResumeEntry | CustomResumeEntry): boolean {
  return !("visible" in entry) || entry.visible;
}

/** 按高度估算将简历模块分配到多个 A4 页面，返回分页数据 */
export function buildResumePages(resume: ResumeDocument): ResumePageData[] {
  const source = resume.modules.filter((module) => {
    if (module.type === "basics" || !module.visible) return false;
    // 自定义模块需要至少一个可见条目
    const visibleItems = module.items.filter(isEntryVisible);
    return visibleItems.length > 0;
  });

  const pages: ResumePageData[] = [];
  let page: ResumePageData = { showHeader: true, modules: [] };
  let remaining = FIRST_PAGE_BUDGET;

  const pushPage = () => {
    pages.push(page);
    page = { showHeader: false, modules: [] };
    remaining = FOLLOWING_PAGE_BUDGET;
  };

  for (const section of source) {
    // 仅处理可见条目
    const visibleItems = section.items.filter(isEntryVisible);
    let cursor = 0;

    while (cursor < visibleItems.length) {
      const firstCost = estimateEntryHeight(visibleItems[cursor]);
      if (
        page.modules.length > 0 &&
        remaining < MODULE_HEADING_HEIGHT + firstCost
      ) {
        pushPage();
      }

      const available = remaining - MODULE_HEADING_HEIGHT;
      const items: EntryLike[] = [];
      let used = 0;

      while (cursor < visibleItems.length) {
        const item = visibleItems[cursor];
        const height = estimateEntryHeight(item);
        if (items.length > 0 && used + height > available) break;
        if (items.length === 0 && height > available && page.modules.length > 0) {
          break;
        }
        items.push(item);
        used += height;
        cursor += 1;
        if (used >= available) break;
      }

      if (items.length === 0) {
        pushPage();
        continue;
      }

      page.modules.push({ ...section, items } as ResumeModule);
      remaining -= MODULE_HEADING_HEIGHT + used;

      if (cursor < visibleItems.length) pushPage();
    }
  }

  if (page.modules.length > 0 || pages.length === 0) pages.push(page);
  return pages;
}
