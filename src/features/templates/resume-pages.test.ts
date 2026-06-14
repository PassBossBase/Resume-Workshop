import { describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import { buildResumePages } from "./resume-pages";

describe("buildResumePages", () => {
  it("splits long resume content into multiple pages without losing entries", () => {
    const resume = createDefaultResume("long-resume");
    const work = resume.modules.find((module) => module.type === "work")!;
    work.items = Array.from({ length: 12 }, (_, index) => ({
      ...work.items[0],
      id: `work-${index}`,
      title: `公司 ${index + 1}`,
      description: "负责产品规划\n推动跨团队协作\n完成数据复盘",
    }));

    const pages = buildResumePages(resume);
    const workTitles = pages.flatMap((page) =>
      page.modules
        .filter((module) => module.type === "work")
        .flatMap((module) => module.items.map((item) => item.title)),
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(workTitles).toEqual(
      Array.from({ length: 12 }, (_, index) => `公司 ${index + 1}`),
    );
    expect(pages[0].showHeader).toBe(true);
    expect(pages.slice(1).every((page) => !page.showHeader)).toBe(true);
  });
});
