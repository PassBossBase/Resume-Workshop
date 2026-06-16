import { describe, expect, it } from "vitest";
import { createDefaultResume } from "@/features/resume-model/resume-model";
import type { ResumeEntry } from "@/features/resume-model/resume-model";
import { buildResumePages } from "./resume-pages";

describe("buildResumePages", () => {
  it("splits long resume content into multiple pages without losing entries", () => {
    const resume = createDefaultResume("long-resume");
    const workModule = resume.modules.find((module) => module.type === "work");
    if (!workModule || workModule.type !== "work") throw new Error("missing work module");

    const template = workModule.items[0];
    workModule.items = Array.from({ length: 12 }, (_, index) => ({
      ...template,
      id: `work-${index}`,
      title: `公司 ${index + 1}`,
      description: "负责产品规划\n推动跨团队协作\n完成数据复盘",
    } as ResumeEntry));

    const pages = buildResumePages(resume);
    const workTitles = pages.flatMap((page) =>
      page.modules
        .filter((module) => module.type === "work")
        .flatMap((module) => {
          if (module.type !== "work") return [];
          return module.items.map((item) => item.title);
        }),
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(workTitles).toEqual(
      Array.from({ length: 12 }, (_, index) => `公司 ${index + 1}`),
    );
    expect(pages[0].showHeader).toBe(true);
    expect(pages.slice(1).every((page) => !page.showHeader)).toBe(true);
  });

  it("filters hidden modules and hidden custom entries", () => {
    const resume = createDefaultResume("filter-test");
    // Hide skills module
    const skills = resume.modules.find((m) => m.type === "skills");
    if (skills) skills.visible = false;

    const pages = buildResumePages(resume);
    const hasSkills = pages.some((page) =>
      page.modules.some((m) => m.type === "skills"),
    );
    expect(hasSkills).toBe(false);
  });
});
