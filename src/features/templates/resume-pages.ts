import type {
  ResumeDocument,
  ResumeEntry,
  ResumeModule,
} from "@/features/resume-model/resume-model";
import { richTextToPlainText } from "@/features/rich-text/rich-text";

export interface ResumePageData {
  showHeader: boolean;
  modules: ResumeModule[];
}

const FIRST_PAGE_BUDGET = 760;
const FOLLOWING_PAGE_BUDGET = 1015;
const MODULE_HEADING_HEIGHT = 48;

function estimateEntryHeight(entry: ResumeEntry): number {
  const lines = richTextToPlainText(entry.description)
    .split("\n")
    .filter(Boolean).length;
  return 58 + Math.max(lines, 1) * 21;
}

/** 按高度估算将简历模块分配到多个 A4 页面，返回分页数据 */
export function buildResumePages(resume: ResumeDocument): ResumePageData[] {
  const source = resume.modules.filter(
    (module) =>
      module.type !== "basics" && module.visible && module.items.length > 0,
  );
  const pages: ResumePageData[] = [];
  let page: ResumePageData = { showHeader: true, modules: [] };
  let remaining = FIRST_PAGE_BUDGET;

  const pushPage = () => {
    pages.push(page);
    page = { showHeader: false, modules: [] };
    remaining = FOLLOWING_PAGE_BUDGET;
  };

  for (const section of source) {
    let cursor = 0;
    while (cursor < section.items.length) {
      const firstCost = estimateEntryHeight(section.items[cursor]);
      if (
        page.modules.length > 0 &&
        remaining < MODULE_HEADING_HEIGHT + firstCost
      ) {
        pushPage();
      }

      const available = remaining - MODULE_HEADING_HEIGHT;
      const items: ResumeEntry[] = [];
      let used = 0;

      while (cursor < section.items.length) {
        const item = section.items[cursor];
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

      page.modules.push({ ...section, items });
      remaining -= MODULE_HEADING_HEIGHT + used;

      if (cursor < section.items.length) pushPage();
    }
  }

  if (page.modules.length > 0 || pages.length === 0) pages.push(page);
  return pages;
}
